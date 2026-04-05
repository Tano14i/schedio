import {
  Prisma,
  AvailabilitySlotSource,
  AvailabilitySlotStatus,
  JobStatus,
  JobType,
  LeadSource,
  LeadStatus,
  ProposalApprovedVia,
  SchedulingProposalStatus,
  UserRole,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
  WhatsAppThreadStatus
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizePhone, parseWhatsAppWebhookPayload } from "@/lib/whatsapp";
import { getThreadStatusAfterInbound, shouldConvertThreadToLead } from "@/lib/whatsapp-p0";
import { analyzeWorkIntake } from "@/lib/ai-intake";

const DEFAULT_COMPANY_NAME = "Schedio";

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function toRequiredJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function getTimestamp(value?: string) {
  if (!value) {
    return new Date();
  }

  const unix = Number(value);
  if (!Number.isNaN(unix) && value.length <= 10) {
    return new Date(unix * 1000);
  }

  return new Date(value);
}

async function getDefaultCompany() {
  const existing = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    return existing;
  }

  return prisma.company.create({
    data: {
      name: DEFAULT_COMPANY_NAME
    }
  });
}

async function getDefaultHandyman(companyId: string) {
  const worker = await prisma.user.findFirst({
    where: { companyId, role: UserRole.WORKER },
    orderBy: { createdAt: "asc" }
  });

  if (worker) {
    return worker;
  }

  return prisma.user.create({
    data: {
      companyId,
      role: UserRole.WORKER,
      name: "Handyman Demo",
      email: `handyman-${Date.now()}@schedio.it`,
      passwordHash: "demo_hash"
    }
  });
}

export async function upsertWhatsAppContact(input: {
  companyId: string;
  waId: string;
  profileName?: string;
  lastInboundAt?: Date;
  lastOutboundAt?: Date;
}) {
  return prisma.whatsAppContact.upsert({
    where: {
      companyId_waId: {
        companyId: input.companyId,
        waId: normalizePhone(input.waId)
      }
    },
    update: {
      profileName: input.profileName ?? undefined,
      lastInboundAt: input.lastInboundAt,
      lastOutboundAt: input.lastOutboundAt
    },
    create: {
      companyId: input.companyId,
      waId: normalizePhone(input.waId),
      profileName: input.profileName,
      lastInboundAt: input.lastInboundAt,
      lastOutboundAt: input.lastOutboundAt
    }
  });
}

export async function getOrCreateOpenThread(input: {
  companyId: string;
  contactId: string;
  customerId?: string;
  leadId?: string;
  lastMessageAt: Date;
}) {
  const existing = await prisma.whatsAppThread.findFirst({
    where: {
      companyId: input.companyId,
      contactId: input.contactId,
      status: {
        in: [
          WhatsAppThreadStatus.OPEN,
          WhatsAppThreadStatus.WAITING_PHOTOS,
          WhatsAppThreadStatus.WAITING_INTERNAL_APPROVAL,
          WhatsAppThreadStatus.WAITING_CUSTOMER_CONFIRMATION
        ]
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (existing) {
    return prisma.whatsAppThread.update({
      where: { id: existing.id },
      data: {
        customerId: input.customerId ?? existing.customerId ?? undefined,
        leadId: input.leadId ?? existing.leadId ?? undefined,
        lastMessageAt: input.lastMessageAt
      }
    });
  }

  return prisma.whatsAppThread.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      customerId: input.customerId,
      leadId: input.leadId,
      status: WhatsAppThreadStatus.OPEN,
      lastMessageAt: input.lastMessageAt
    }
  });
}

export async function persistInboundMessage(input: {
  companyId: string;
  contactId: string;
  threadId: string;
  metaMessageId?: string;
  type: WhatsAppMessageType;
  textBody?: string;
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  storagePath?: string;
  interactivePayload?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
  receivedAt: Date;
}) {
  if (input.metaMessageId) {
    const existing = await prisma.whatsAppMessage.findUnique({
      where: { metaMessageId: input.metaMessageId }
    });
    if (existing) {
      return existing;
    }
  }

  return prisma.whatsAppMessage.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      threadId: input.threadId,
      direction: WhatsAppMessageDirection.INBOUND,
      messageType: input.type,
      metaMessageId: input.metaMessageId,
      textBody: input.textBody,
      mediaId: input.mediaId,
      mediaUrl: input.mediaUrl,
      mimeType: input.mimeType,
      storagePath: input.storagePath,
      interactivePayload: toJsonValue(input.interactivePayload),
      rawPayload: toJsonValue(input.rawPayload),
      receivedAt: input.receivedAt
    }
  });
}

export async function persistOutboundMessage(input: {
  companyId: string;
  contactId: string;
  threadId: string;
  metaMessageId?: string;
  type: WhatsAppMessageType;
  textBody?: string;
  templateName?: string;
  rawPayload?: Record<string, unknown>;
  sentAt?: Date;
  status?: WhatsAppMessageStatus;
}) {
  return prisma.whatsAppMessage.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      threadId: input.threadId,
      direction: WhatsAppMessageDirection.OUTBOUND,
      messageType: input.type,
      metaMessageId: input.metaMessageId,
      textBody: input.textBody,
      templateName: input.templateName,
      rawPayload: toJsonValue(input.rawPayload),
      sentAt: input.sentAt ?? new Date(),
      status: input.status ?? WhatsAppMessageStatus.QUEUED
    }
  });
}

export async function markMessageStatus(input: {
  metaMessageId: string;
  status: WhatsAppMessageStatus;
  timestamp?: Date;
}) {
  const existing = await prisma.whatsAppMessage.findUnique({
    where: { metaMessageId: input.metaMessageId }
  });

  if (!existing) {
    return null;
  }

  return prisma.whatsAppMessage.update({
    where: { id: existing.id },
    data: {
      status: input.status,
      sentAt: existing.sentAt ?? input.timestamp
    }
  });
}

export async function downloadWhatsAppMedia(input: {
  mediaId: string;
  accessToken?: string;
  graphVersion?: string;
}) {
  const accessToken = input.accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      mediaId: input.mediaId,
      mimeType: "application/octet-stream",
      downloadUrl: null,
      storagePath: `whatsapp/unconfigured/${input.mediaId}`
    };
  }

  const version = input.graphVersion ?? process.env.WHATSAPP_GRAPH_VERSION ?? "v22.0";
  const metadataResponse = await fetch(`https://graph.facebook.com/${version}/${input.mediaId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!metadataResponse.ok) {
    throw new Error(`Unable to fetch WhatsApp media metadata for ${input.mediaId}`);
  }

  const metadata = (await metadataResponse.json()) as {
    url?: string;
    mime_type?: string;
  };

  return {
    mediaId: input.mediaId,
    mimeType: metadata.mime_type ?? "application/octet-stream",
    downloadUrl: metadata.url ?? null,
    storagePath: `whatsapp/media/${input.mediaId}`
  };
}

export async function createLeadFromWhatsAppThread(threadId: string) {
  const thread = await prisma.whatsAppThread.findUnique({
    where: { id: threadId },
    include: {
      contact: true,
      customer: true,
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!thread) {
    throw new Error("WhatsApp thread not found");
  }

  if (thread.leadId) {
    return prisma.lead.findUnique({ where: { id: thread.leadId } });
  }

  const textMessages = thread.messages.filter(
    (message) =>
      message.direction === WhatsAppMessageDirection.INBOUND &&
      message.messageType === WhatsAppMessageType.TEXT &&
      message.textBody
  );
  const imageMessages = thread.messages.filter(
    (message) => message.messageType === WhatsAppMessageType.IMAGE
  );

  const description =
    textMessages.map((message) => message.textBody).filter(Boolean).join("\n").trim() ||
    "Richiesta arrivata da WhatsApp.";
  const intakeSuggestion = await analyzeWorkIntake({
    text: description,
    customerName: thread.customer?.fullName ?? thread.contact.profileName ?? undefined,
    phone: thread.contact.waId,
    photoCount: imageMessages.length
  });

  const customer =
    thread.customer ??
    (await prisma.customer.create({
      data: {
        companyId: thread.companyId,
        fullName:
          intakeSuggestion.customerName ||
          thread.contact.profileName ||
          `Cliente ${thread.contact.waId}`,
        phone: thread.contact.waId,
        address: intakeSuggestion.address
      }
    }));

  if (!customer.address && intakeSuggestion.address) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { address: intakeSuggestion.address }
    });
  }

  if (!thread.customerId) {
    await prisma.whatsAppContact.update({
      where: { id: thread.contactId },
      data: { customerId: customer.id }
    });
  }

  const lead = await prisma.lead.create({
    data: {
      companyId: thread.companyId,
      customerId: customer.id,
      source: LeadSource.WHATSAPP,
      serviceType: intakeSuggestion.serviceType || guessServiceType(description),
      description,
      urgency: intakeSuggestion.urgency,
      urgencyLevel: intakeSuggestion.urgency,
      status: LeadStatus.NEW
    }
  });

  await prisma.whatsAppThread.update({
    where: { id: thread.id },
    data: {
      customerId: customer.id,
      leadId: lead.id,
      status: imageMessages.length > 0
        ? WhatsAppThreadStatus.WAITING_INTERNAL_APPROVAL
        : WhatsAppThreadStatus.WAITING_PHOTOS
    }
  });

  await prisma.activityLog.create({
    data: {
      companyId: thread.companyId,
      entityType: "lead",
      entityId: lead.id,
      eventType: "lead_created_from_whatsapp",
      metadataJson: toJsonValue({
        threadId: thread.id,
        images: imageMessages.map((message) => message.storagePath).filter(Boolean),
        aiIntake: intakeSuggestion
      })
    }
  });

  return lead;
}

export async function createLeadCaptureFromWhatsAppIntake(input: {
  customerName: string;
  phone: string;
  serviceType: string;
  description: string;
  rawIntake?: string;
  address?: string;
  measurements?: string;
  preferredWindow?: string;
  photos?: string[];
}) {
  const company = await getDefaultCompany();
  const contact = await upsertWhatsAppContact({
    companyId: company.id,
    waId: input.phone,
    profileName: input.customerName,
    lastInboundAt: new Date()
  });

  const thread = await getOrCreateOpenThread({
    companyId: company.id,
    contactId: contact.id,
    customerId: contact.customerId ?? undefined,
    lastMessageAt: new Date()
  });

  await persistOutboundMessage({
    companyId: company.id,
    contactId: contact.id,
    threadId: thread.id,
    type: WhatsAppMessageType.TEMPLATE,
    textBody: "Abbiamo inviato il Flow WhatsApp per raccogliere i dettagli della richiesta.",
    templateName: "start_request",
    status: WhatsAppMessageStatus.DELIVERED
  });

  await persistInboundMessage({
    companyId: company.id,
    contactId: contact.id,
    threadId: thread.id,
    type: WhatsAppMessageType.TEXT,
    textBody:
      input.rawIntake?.trim() ||
      `${input.serviceType}\n${input.description}${input.measurements ? `\nMisure: ${input.measurements}` : ""}${input.address ? `\nIndirizzo: ${input.address}` : ""}${input.preferredWindow ? `\nFinestra preferita: ${input.preferredWindow}` : ""}`,
    rawPayload: input as unknown as Record<string, unknown>,
    receivedAt: new Date()
  });

  if (input.photos?.length) {
    await Promise.all(
      input.photos.map((photo, index) =>
        persistInboundMessage({
          companyId: company.id,
          contactId: contact.id,
          threadId: thread.id,
          type: WhatsAppMessageType.IMAGE,
          mediaId: `intake-photo-${index + 1}`,
          storagePath: photo,
          rawPayload: { source: "intake", photo },
          receivedAt: new Date()
        })
      )
    );
  }

  const lead = await createLeadFromWhatsAppThread(thread.id);

  return { company, contact, thread, lead };
}

export async function generateCandidateSlots(input: {
  companyId: string;
  leadId: string;
  handymanUserId?: string;
  limit?: number;
}) {
  const handyman = input.handymanUserId
    ? await prisma.user.findUniqueOrThrow({ where: { id: input.handymanUserId } })
    : await getDefaultHandyman(input.companyId);
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: input.leadId },
    include: { customer: true }
  });
  const limit = input.limit ?? 3;
  const starts: Array<{ startsAt: Date; endsAt: Date }> = [];
  const base = new Date();
  base.setHours(9, 0, 0, 0);

  for (let index = 1; index <= limit; index += 1) {
    const start = new Date(base);
    start.setDate(base.getDate() + index);
    start.setHours(9 + (index - 1) * 2, 0, 0, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 45);
    starts.push({ startsAt: start, endsAt: end });
  }

  const createdSlots = await Promise.all(
    starts.map((slot) =>
      prisma.availabilitySlot.create({
        data: {
          companyId: input.companyId,
          userId: handyman.id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status: AvailabilitySlotStatus.RESERVED,
          source: AvailabilitySlotSource.GENERATED,
          relatedLeadId: lead.id
        }
      })
    )
  );

  return { handyman, lead, slots: createdSlots };
}

export async function createSchedulingProposal(input: {
  companyId: string;
  leadId: string;
  threadId?: string;
  handymanUserId: string;
  slotIds: string[];
}) {
  const slots = await prisma.availabilitySlot.findMany({
    where: { id: { in: input.slotIds } },
    orderBy: { startsAt: "asc" }
  });

  if (!slots.length) {
    throw new Error("No candidate slots found");
  }

  return prisma.schedulingProposal.create({
    data: {
      companyId: input.companyId,
      leadId: input.leadId,
      threadId: input.threadId,
      handymanUserId: input.handymanUserId,
      status: SchedulingProposalStatus.PENDING_HANDYMAN_APPROVAL,
      selectedSlotId: slots[0].id,
      candidateSlotsJson: toRequiredJsonValue(slots.map((slot) => ({
        slotId: slot.id,
        startsAt: slot.startsAt.toISOString(),
        endsAt: slot.endsAt.toISOString()
      }))),
      publicToken: `sched-${crypto.randomUUID()}`
    }
  });
}

export async function createProposalForLead(input: { leadId: string; limit?: number }) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: input.leadId }
  });

  const { handyman, slots } = await generateCandidateSlots({
    companyId: lead.companyId,
    leadId: lead.id,
    limit: input.limit
  });

  const thread = await prisma.whatsAppThread.findFirst({
    where: { leadId: lead.id },
    orderBy: { updatedAt: "desc" }
  });

  const proposal = await createSchedulingProposal({
    companyId: lead.companyId,
    leadId: lead.id,
    threadId: thread?.id,
    handymanUserId: handyman.id,
    slotIds: slots.map((slot) => slot.id)
  });

  if (thread) {
    await prisma.whatsAppThread.update({
      where: { id: thread.id },
      data: {
        status: WhatsAppThreadStatus.WAITING_INTERNAL_APPROVAL,
        lastMessageAt: new Date()
      }
    });
  }

  return { proposal, slots, handyman };
}

export async function approveSchedulingProposal(input: {
  proposalId: string;
  selectedSlotId?: string;
  approvedVia?: ProposalApprovedVia;
}) {
  const proposal = await prisma.schedulingProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
    include: {
      lead: { include: { customer: true } },
      thread: { include: { contact: true } }
    }
  });

  const selectedSlotId = input.selectedSlotId ?? proposal.selectedSlotId;
  if (!selectedSlotId) {
    throw new Error("No selected slot for proposal");
  }

  const updated = await prisma.schedulingProposal.update({
    where: { id: proposal.id },
    data: {
      status: SchedulingProposalStatus.APPROVED,
      approvedVia: input.approvedVia ?? ProposalApprovedVia.PANEL,
      selectedSlotId
    }
  });

  await prisma.activityLog.create({
    data: {
      companyId: proposal.companyId,
      entityType: "lead",
      entityId: proposal.leadId,
      eventType: "scheduling_proposal_approved",
      metadataJson: toJsonValue({
        proposalId: proposal.id,
        selectedSlotId
      })
    }
  });

  return updated;
}

export async function sendVisitProposalToCustomer(proposalId: string) {
  const proposal = await prisma.schedulingProposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: {
      thread: { include: { contact: true } },
      lead: { include: { customer: true } },
      selectedSlot: true
    }
  });

  if (!proposal.thread || !proposal.selectedSlot) {
    throw new Error("Proposal is missing thread or selected slot");
  }

  const text = `Ciao ${proposal.lead.customer.fullName}, possiamo fare il sopralluogo il ${new Intl.DateTimeFormat(
    "it-IT",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(proposal.selectedSlot.startsAt)}. Ti va bene?`;

  const updated = await prisma.schedulingProposal.update({
    where: { id: proposal.id },
    data: {
      status: SchedulingProposalStatus.SENT_TO_CUSTOMER
    }
  });

  await prisma.whatsAppThread.update({
    where: { id: proposal.threadId! },
    data: {
      status: WhatsAppThreadStatus.WAITING_CUSTOMER_CONFIRMATION,
      lastMessageAt: new Date(),
      lastOutboundAt: new Date()
    }
  });

  await persistOutboundMessage({
    companyId: proposal.companyId,
    contactId: proposal.thread.contactId,
    threadId: proposal.threadId!,
    type: WhatsAppMessageType.TEXT,
    textBody: text,
    status: WhatsAppMessageStatus.SENT
  });

  return updated;
}

export async function confirmCustomerSlot(publicToken: string) {
  const proposal = await prisma.schedulingProposal.findUniqueOrThrow({
    where: { publicToken },
    include: {
      lead: { include: { customer: true } },
      thread: true,
      selectedSlot: true
    }
  });

  if (!proposal.selectedSlot) {
    throw new Error("Proposal has no selected slot");
  }

  const job = await prisma.job.create({
    data: {
      companyId: proposal.companyId,
      leadId: proposal.leadId,
      customerId: proposal.lead.customerId,
      assignedUserId: proposal.handymanUserId,
      title: `Sopralluogo ${proposal.lead.serviceType.toLowerCase()}`,
      type: JobType.ESTIMATE_VISIT,
      startAt: proposal.selectedSlot.startsAt,
      endAt: proposal.selectedSlot.endsAt,
      status: JobStatus.SCHEDULED,
      address: proposal.lead.customer.address ?? "Indirizzo da confermare",
      notes: proposal.lead.description
    }
  });

  await prisma.lead.update({
    where: { id: proposal.leadId },
    data: { status: LeadStatus.SCHEDULED }
  });

  await prisma.availabilitySlot.update({
    where: { id: proposal.selectedSlot.id },
    data: {
      status: AvailabilitySlotStatus.BOOKED,
      relatedJobId: job.id
    }
  });

  await prisma.schedulingProposal.update({
    where: { id: proposal.id },
    data: { status: SchedulingProposalStatus.CUSTOMER_CONFIRMED }
  });

  if (proposal.threadId) {
    await prisma.whatsAppThread.update({
      where: { id: proposal.threadId },
      data: {
        status: WhatsAppThreadStatus.CLOSED,
        lastMessageAt: new Date(),
        lastInboundAt: new Date()
      }
    });
  }

  await prisma.activityLog.createMany({
    data: [
      {
        companyId: proposal.companyId,
        entityType: "lead",
        entityId: proposal.leadId,
        eventType: "visit_confirmed_by_customer",
        metadataJson: toJsonValue({ jobId: job.id, proposalId: proposal.id })
      },
      {
        companyId: proposal.companyId,
        entityType: "job",
        entityId: job.id,
        eventType: "job_created_from_scheduling_proposal",
        metadataJson: toJsonValue({ proposalId: proposal.id })
      }
    ]
  });

  return job;
}

export async function handleWhatsAppWebhook(payload: unknown) {
  const company = await getDefaultCompany();
  const parsed = parseWhatsAppWebhookPayload(payload);

  for (const contactInfo of parsed.contacts) {
    await upsertWhatsAppContact({
      companyId: company.id,
      waId: contactInfo.phone,
      profileName: contactInfo.name
    });
  }

  for (const inbound of parsed.inboundMessages) {
    const matchingContact =
      parsed.contacts.find((contact) => normalizePhone(contact.phone) === normalizePhone(inbound.from)) ??
      { phone: inbound.from, name: "Cliente WhatsApp" };

    const contact = await upsertWhatsAppContact({
      companyId: company.id,
      waId: inbound.from,
      profileName: matchingContact.name,
      lastInboundAt: getTimestamp(inbound.timestamp)
    });

    const thread = await getOrCreateOpenThread({
      companyId: company.id,
      contactId: contact.id,
      customerId: contact.customerId ?? undefined,
      lastMessageAt: getTimestamp(inbound.timestamp)
    });

    const messageType =
      inbound.type === "image"
        ? WhatsAppMessageType.IMAGE
        : inbound.type === "interactive"
          ? WhatsAppMessageType.INTERACTIVE_BUTTON
          : WhatsAppMessageType.TEXT;

    let mediaData:
      | {
          mediaId: string;
          mimeType: string;
          downloadUrl: string | null;
          storagePath: string;
        }
      | undefined;

    if (messageType === WhatsAppMessageType.IMAGE && "mediaId" in inbound && inbound.mediaId) {
      mediaData = await downloadWhatsAppMedia({ mediaId: inbound.mediaId });
    }

    await persistInboundMessage({
      companyId: company.id,
      contactId: contact.id,
      threadId: thread.id,
      metaMessageId: inbound.id,
      type: messageType,
      textBody: inbound.text,
      mediaId: inbound.mediaId ?? mediaData?.mediaId,
      mediaUrl: mediaData?.downloadUrl ?? undefined,
      mimeType: mediaData?.mimeType,
      storagePath: mediaData?.storagePath,
      interactivePayload:
        inbound.interactiveType ? { type: inbound.interactiveType } : undefined,
      rawPayload: inbound.raw as Record<string, unknown> | undefined,
      receivedAt: getTimestamp(inbound.timestamp)
    });

    const updatedThread = await prisma.whatsAppThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: getTimestamp(inbound.timestamp),
        lastInboundAt: getTimestamp(inbound.timestamp),
        status: getThreadStatusAfterInbound({
          currentStatus: thread.status,
          messageType:
            messageType === WhatsAppMessageType.IMAGE
              ? "image"
              : messageType === WhatsAppMessageType.INTERACTIVE_BUTTON
                ? "interactive"
                : "text",
          hasLead: Boolean(thread.leadId)
        })
      }
    });

    const textMessageCount = await prisma.whatsAppMessage.count({
      where: {
        threadId: updatedThread.id,
        messageType: WhatsAppMessageType.TEXT
      }
    });
    const imageMessageCount = await prisma.whatsAppMessage.count({
      where: {
        threadId: updatedThread.id,
        messageType: WhatsAppMessageType.IMAGE
      }
    });

    if (
      shouldConvertThreadToLead({
        leadId: updatedThread.leadId,
        textMessageCount,
        imageMessageCount
      })
    ) {
      await createLeadFromWhatsAppThread(updatedThread.id);
    }
  }

  for (const status of parsed.statuses) {
    if (!status.id) {
      continue;
    }

    const mappedStatus =
      status.status === "delivered"
        ? WhatsAppMessageStatus.DELIVERED
        : status.status === "read"
          ? WhatsAppMessageStatus.READ
          : status.status === "failed"
            ? WhatsAppMessageStatus.FAILED
            : WhatsAppMessageStatus.SENT;

    await markMessageStatus({
      metaMessageId: status.id,
      status: mappedStatus,
      timestamp: getTimestamp(status.timestamp)
    });
  }

  return parsed;
}

function guessServiceType(description: string) {
  const lower = description.toLowerCase();

  if (lower.includes("tapparella")) {
    return "Riparazione tapparella";
  }
  if (lower.includes("rubinetto") || lower.includes("perdita")) {
    return "Perdita rubinetto";
  }
  if (lower.includes("porta")) {
    return "Riparazione porta";
  }
  if (lower.includes("mensole")) {
    return "Montaggio mensole";
  }

  return "Intervento da definire";
}
