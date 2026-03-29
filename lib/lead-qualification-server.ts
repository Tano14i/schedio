import {
  BudgetRange,
  NextBestAction,
  Prisma,
  QualificationConfidence,
  QualificationStatus,
  ServiceAreaMatch,
  WhatsAppMessageStatus,
  WhatsAppMessageType
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  evaluateLeadQualification,
  inferJobSize,
  matchServiceArea,
  toPrismaQualificationValue,
  type QualificationReasonCode
} from "@/lib/lead-qualification";
import { persistOutboundMessage } from "@/lib/whatsapp-server";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function getServiceAreas(companyId?: string) {
  const company = companyId
    ? await prisma.company.findUnique({ where: { id: companyId } })
    : await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (!company) {
    return [];
  }

  return prisma.serviceArea.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" }
  });
}

export async function qualifyLead(leadId: string) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      customer: true,
      whatsappThreads: {
        include: {
          messages: true,
          contact: true
        },
        orderBy: { updatedAt: "desc" },
        take: 1
      }
    }
  });

  const serviceAreas = await getServiceAreas(lead.companyId);
  const thread = lead.whatsappThreads[0];
  const photoCount =
    thread?.messages.filter((message) => message.messageType === "IMAGE").length ?? 0;
  const measurements = thread?.messages
    .map((message) => message.textBody)
    .find((text) => text?.toLowerCase().includes("misure:"));
  const jobSize = (
    lead.jobSize === "UNKNOWN"
      ? inferJobSize({ serviceType: lead.serviceType, description: lead.description })
      : lead.jobSize.toLowerCase()
  ) as "unknown" | "small" | "medium" | "large";
  const budgetRange = lead.budgetRange.toLowerCase() as "unknown" | "low" | "medium" | "high";

  const decision = evaluateLeadQualification({
    serviceType: lead.serviceType,
    description: lead.description,
    address: lead.customer.address,
    photoCount,
    measurements,
    jobSize,
    budgetRange,
    serviceAreas: serviceAreas.map((area) => ({
      id: area.id,
      companyId: area.companyId,
      label: area.label,
      city: area.city ?? undefined,
      postalCodePrefix: area.postalCodePrefix ?? undefined,
      active: area.active,
      createdAt: area.createdAt.toISOString(),
      updatedAt: area.updatedAt.toISOString()
    }))
  });

  const updatedLead = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      qualificationStatus: toPrismaQualificationValue(decision.qualificationStatus) as QualificationStatus,
      serviceAreaMatch: toPrismaQualificationValue(decision.serviceAreaMatch) as ServiceAreaMatch,
      jobSize: toPrismaQualificationValue(jobSize) as "UNKNOWN" | "SMALL" | "MEDIUM" | "LARGE",
      qualificationReason: decision.reasonCode,
      qualificationConfidence: toPrismaQualificationValue(decision.confidence) as QualificationConfidence,
      nextBestAction: toPrismaQualificationValue(decision.nextBestAction) as NextBestAction,
      qualifiedAt: decision.qualificationStatus === "qualified" ? new Date() : null
    }
  });

  await prisma.activityLog.create({
    data: {
      companyId: lead.companyId,
      entityType: "lead",
      entityId: lead.id,
      eventType: qualificationEvent(decision.qualificationStatus),
      metadataJson: toJsonValue({
        reasonCode: decision.reasonCode,
        confidence: decision.confidence,
        missingFields: decision.missingFields
      })
    }
  });

  return { lead: updatedLead, decision };
}

export async function requestClarification(leadId: string) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      customer: true,
      whatsappThreads: {
        include: { contact: true },
        orderBy: { updatedAt: "desc" },
        take: 1
      }
    }
  });

  const message = clarificationMessage(lead.qualificationReason as QualificationReasonCode | null);

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      qualificationStatus: QualificationStatus.NEEDS_CLARIFICATION,
      nextBestAction: NextBestAction.ASK_CLARIFICATION
    }
  });

  const thread = lead.whatsappThreads[0];
  if (thread) {
    await persistOutboundMessage({
      companyId: lead.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: message,
      status: WhatsAppMessageStatus.SENT
    });
  }

  await prisma.activityLog.create({
    data: {
      companyId: lead.companyId,
      entityType: "lead",
      entityId: lead.id,
      eventType: "clarification_requested",
      metadataJson: toJsonValue({ message })
    }
  });

  return { leadId: lead.id, message };
}

export async function setLeadQualification(leadId: string, input: {
  qualificationStatus: QualificationStatus;
  nextBestAction: NextBestAction;
  qualificationReason: string;
  qualificationConfidence?: QualificationConfidence;
}) {
  const currentLead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: {
      whatsappThreads: {
        include: { contact: true },
        orderBy: { updatedAt: "desc" },
        take: 1
      }
    }
  });

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      qualificationStatus: input.qualificationStatus,
      nextBestAction: input.nextBestAction,
      qualificationReason: input.qualificationReason,
      qualificationConfidence: input.qualificationConfidence ?? QualificationConfidence.HIGH,
      qualifiedAt: input.qualificationStatus === QualificationStatus.QUALIFIED ? new Date() : null
    }
  });

  const outboundMessage = qualificationMessageForStatus(
    input.qualificationStatus,
    input.qualificationReason as QualificationReasonCode | null
  );
  const thread = currentLead.whatsappThreads[0];

  if (thread && outboundMessage) {
    await persistOutboundMessage({
      companyId: lead.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: outboundMessage,
      status: WhatsAppMessageStatus.SENT
    });

    await prisma.whatsAppThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        lastOutboundAt: new Date()
      }
    });
  }

  await prisma.activityLog.create({
    data: {
      companyId: lead.companyId,
      entityType: "lead",
      entityId: lead.id,
      eventType: qualificationEvent(input.qualificationStatus.toLowerCase() as Lowercase<`${QualificationStatus}`>),
      metadataJson: toJsonValue({
        manual: true,
        qualificationReason: input.qualificationReason,
        messageSent: Boolean(outboundMessage)
      })
    }
  });

  return lead;
}

export async function overrideLeadQualification(leadId: string, input: {
  qualificationStatus: QualificationStatus;
  nextBestAction: NextBestAction;
  qualificationReason: string;
}) {
  const lead = await setLeadQualification(leadId, {
    ...input,
    qualificationConfidence: QualificationConfidence.HIGH
  });

  await prisma.activityLog.create({
    data: {
      companyId: lead.companyId,
      entityType: "lead",
      entityId: lead.id,
      eventType: "lead_qualification_overridden",
      metadataJson: toJsonValue(input)
    }
  });

  return lead;
}

export async function createServiceArea(input: {
  companyId?: string;
  label: string;
  city?: string;
  postalCodePrefix?: string;
  active?: boolean;
}) {
  const company =
    input.companyId
      ? await prisma.company.findUniqueOrThrow({ where: { id: input.companyId } })
      : await prisma.company.findFirstOrThrow({ orderBy: { createdAt: "asc" } });

  return prisma.serviceArea.create({
    data: {
      companyId: company.id,
      label: input.label,
      city: input.city,
      postalCodePrefix: input.postalCodePrefix,
      active: input.active ?? true
    }
  });
}

export async function updateServiceArea(areaId: string, input: {
  label?: string;
  city?: string | null;
  postalCodePrefix?: string | null;
  active?: boolean;
}) {
  return prisma.serviceArea.update({
    where: { id: areaId },
    data: {
      label: input.label,
      city: input.city ?? undefined,
      postalCodePrefix: input.postalCodePrefix ?? undefined,
      active: input.active
    }
  });
}

export async function getQualificationKpis() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!company) {
    return null;
  }

  const whatsappLeads = await prisma.lead.findMany({
    where: { companyId: company.id, source: "WHATSAPP" },
    orderBy: { createdAt: "desc" }
  });

  const totals = {
    received: whatsappLeads.length,
    qualified: whatsappLeads.filter((lead) => lead.qualificationStatus === "QUALIFIED").length,
    needsClarification: whatsappLeads.filter((lead) => lead.qualificationStatus === "NEEDS_CLARIFICATION").length,
    outOfArea: whatsappLeads.filter((lead) => lead.qualificationStatus === "OUT_OF_AREA").length,
    lowPriority: whatsappLeads.filter((lead) => lead.qualificationStatus === "LOW_PRIORITY").length
  };

  const timed = whatsappLeads.filter((lead) => lead.qualifiedAt);
  const averageMinutes = timed.length
    ? Math.round(
        timed.reduce((sum, lead) => {
          const diff = new Date(lead.qualifiedAt!).getTime() - new Date(lead.createdAt).getTime();
          return sum + diff / 60000;
        }, 0) / timed.length
      )
    : null;

  return {
    totals,
    averageMinutes
  };
}

function qualificationEvent(status: string) {
  const map: Record<string, string> = {
    qualified: "lead_qualified",
    out_of_area: "lead_marked_out_of_area",
    low_priority: "lead_marked_low_priority",
    needs_clarification: "lead_needs_clarification",
    rejected: "lead_rejected"
  };

  return map[status] ?? "lead_qualification_started";
}

function clarificationMessage(reason: QualificationReasonCode | null) {
  switch (reason) {
    case "missing_photos":
      return "Grazie, per aiutarti meglio mandaci 1-5 foto del problema.";
    case "missing_measurements":
      return "Se puoi, scrivici anche una misura approssimativa. Ci aiuta a capire meglio l'intervento.";
    case "outside_area":
      return "Grazie per la richiesta. Al momento non operiamo nella tua zona.";
    case "unsupported_service":
      return "Grazie per averci scritto. Al momento non seguiamo questo tipo di intervento.";
    default:
      return "Grazie, ci serve qualche dettaglio in piu per aiutarti meglio.";
  }
}

function qualificationMessageForStatus(
  status: QualificationStatus,
  reason: QualificationReasonCode | null
) {
  if (status === QualificationStatus.OUT_OF_AREA || status === QualificationStatus.REJECTED) {
    return clarificationMessage(reason);
  }

  if (status === QualificationStatus.LOW_PRIORITY) {
    return "Grazie per la richiesta. Al momento la teniamo in coda e ti ricontatteremo se si libera uno slot adatto.";
  }

  return null;
}
