import {
  AutomationType,
  EstimateStatus,
  JobCompletionStatus,
  JobStatus,
  LeadStatus,
  Prisma,
  WhatsAppMessageStatus,
  WhatsAppMessageType
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";
import {
  markAutomationFailed,
  markAutomationSent,
  queueAutomationLog,
  removeQueuedAutomationLogs
} from "@/lib/automation-runtime";
import { persistOutboundMessage } from "@/lib/whatsapp-server";

type EstimateItemInput = {
  label: string;
  description?: string | null;
  qty: number;
  unitPrice: number;
  sortOrder?: number;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeItems(items: EstimateItemInput[]) {
  return items.map((item, index) => ({
    label: item.label,
    description: item.description ?? undefined,
    qty: normalizeNumber(item.qty),
    unitPrice: normalizeNumber(item.unitPrice),
    sortOrder: item.sortOrder ?? index + 1
  }));
}

export function calculateEstimateTotals(items: EstimateItemInput[], taxRate = 0) {
  const normalized = normalizeItems(items);
  const subtotal = Number(
    normalized.reduce((sum, item) => sum + item.qty * item.unitPrice, 0).toFixed(2)
  );
  const tax = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return {
    items: normalized,
    subtotal,
    tax,
    total
  };
}

async function getDefaultCompany() {
  return prisma.company.findFirstOrThrow({
    orderBy: { createdAt: "asc" }
  });
}

async function logActivity(input: {
  companyId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      metadataJson: input.metadata ? toJsonValue(input.metadata) : undefined
    }
  });
}

async function nextEstimateNumber(companyId: string) {
  const count = await prisma.estimate.count({ where: { companyId } });
  return `Q-2026-${String(count + 1).padStart(3, "0")}`;
}

function aggregateThreadNotes(messages: Array<{ textBody: string | null; storagePath: string | null }>) {
  const textNotes = messages
    .map((message) => message.textBody?.trim())
    .filter((value): value is string => Boolean(value));
  const measurements = textNotes.find((value) => value.toLowerCase().includes("misure"));
  const photoPaths = messages
    .map((message) => message.storagePath)
    .filter((value): value is string => Boolean(value));

  return {
    measurements,
    attachments: photoPaths,
    combinedNotes: textNotes.join("\n")
  };
}

export async function applyEstimateTemplate(companyId: string, serviceType?: string | null) {
  if (!serviceType) {
    return prisma.estimateTemplate.findFirst({
      where: { companyId, active: true },
      orderBy: [{ serviceType: "asc" }, { createdAt: "asc" }]
    });
  }

  return (
    (await prisma.estimateTemplate.findFirst({
      where: {
        companyId,
        active: true,
        serviceType: {
          equals: serviceType,
          mode: "insensitive"
        }
      }
    })) ??
    prisma.estimateTemplate.findFirst({
      where: { companyId, active: true },
      orderBy: { createdAt: "asc" }
    })
  );
}

export async function completeJobAndCaptureSummary(
  jobId: string,
  input: {
    completionNotes?: string;
    internalSummary?: string;
    notes?: string;
  }
) {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.COMPLETED,
      completionStatus: JobCompletionStatus.COMPLETED,
      completedAt: new Date(),
      completionNotes: input.completionNotes ?? undefined,
      internalSummary: input.internalSummary ?? undefined,
      notes: input.notes ?? undefined
    }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_completed",
    metadata: {
      completionNotes: input.completionNotes ?? null,
      internalSummary: input.internalSummary ?? null
    }
  });

  return job;
}

export async function createEstimateDraftFromJob(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      customer: true,
      assignedUser: true,
      lead: true,
      estimates: {
        where: { status: EstimateStatus.DRAFT },
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (job.estimates[0]) {
    return job.estimates[0];
  }

  const thread = job.leadId
    ? await prisma.whatsAppThread.findFirst({
        where: { leadId: job.leadId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { updatedAt: "desc" }
      })
    : null;
  const template = await applyEstimateTemplate(job.companyId, job.lead?.serviceType ?? job.title);
  const threadNotes = aggregateThreadNotes(
    thread?.messages.map((message) => ({
      textBody: message.textBody,
      storagePath: message.storagePath
    })) ?? []
  );

  const suggestedItems = Array.isArray(template?.itemsJson)
    ? (template?.itemsJson as EstimateItemInput[])
    : [
        {
          label: job.title,
          description: job.completionNotes ?? job.notes ?? job.lead?.description ?? "Intervento da definire",
          qty: 1,
          unitPrice: 0
        }
      ];
  const totals = calculateEstimateTotals(suggestedItems);
  const number = await nextEstimateNumber(job.companyId);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  const estimate = await prisma.estimate.create({
    data: {
      companyId: job.companyId,
      customerId: job.customerId,
      leadId: job.leadId,
      jobId: job.id,
      number,
      status: EstimateStatus.DRAFT,
      title: `Preventivo ${job.title}`,
      introText:
        template?.introText ?? "Preventivo precompilato dai dati raccolti durante il sopralluogo.",
      scopeSummary:
        job.completionNotes ?? template?.scopeSummary ?? job.lead?.description ?? job.notes ?? null,
      notes: [template?.notes, job.internalSummary, threadNotes.measurements, threadNotes.combinedNotes]
        .filter(Boolean)
        .join("\n\n"),
      terms: template?.terms ?? "Pagamento a conferma del lavoro o a fine intervento.",
      validUntil,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      publicToken: crypto.randomUUID(),
      items: {
        create: totals.items
      }
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  await prisma.job.update({
    where: { id: job.id },
    data: {
      estimateDraftedAt: new Date()
    }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_draft_created",
    metadata: {
      jobId: job.id,
      templateId: template?.id ?? null,
      attachments: threadNotes.attachments
    }
  });

  return estimate;
}

export async function createJobFromEstimate(estimateId: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: {
      customer: true,
      lead: true
    }
  });

  if (estimate.status !== EstimateStatus.ACCEPTED) {
    throw new Error("Il lavoro si crea solo da un preventivo accettato.");
  }

  const existingJob = await prisma.job.findFirst({
    where: {
      companyId: estimate.companyId,
      leadId: estimate.leadId ?? undefined,
      customerId: estimate.customerId,
      type: "JOB"
    },
    orderBy: { createdAt: "desc" }
  });

  if (existingJob) {
    return existingJob;
  }

  const startAt = new Date();
  startAt.setDate(startAt.getDate() + 1);
  startAt.setHours(9, 0, 0, 0);

  const endAt = new Date(startAt);
  endAt.setHours(endAt.getHours() + 2);

  const job = await prisma.job.create({
    data: {
      companyId: estimate.companyId,
      leadId: estimate.leadId,
      customerId: estimate.customerId,
      title: estimate.title ?? estimate.lead?.serviceType ?? `Lavoro ${estimate.number}`,
      type: "JOB",
      startAt,
      endAt,
      status: JobStatus.SCHEDULED,
      address: estimate.customer.address ?? "Indirizzo da confermare",
      notes: estimate.scopeSummary ?? estimate.notes ?? undefined
    }
  });

  if (estimate.leadId) {
    await prisma.lead.update({
      where: { id: estimate.leadId },
      data: { status: LeadStatus.WON }
    });
  }

  await logActivity({
    companyId: estimate.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_scheduled",
    metadata: {
      message: `Lavoro creato dal preventivo ${estimate.number}.`
    }
  });

  await logActivity({
    companyId: estimate.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_converted_to_job",
    metadata: {
      jobId: job.id
    }
  });

  return job;
}

export async function updateEstimate(
  estimateId: string,
  input: {
    title?: string | null;
    introText?: string | null;
    scopeSummary?: string | null;
    notes?: string | null;
    terms?: string | null;
    validUntil?: string | null;
    items?: EstimateItemInput[];
  }
) {
  const existing = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: { items: true }
  });
  const totals = input.items ? calculateEstimateTotals(input.items) : null;

  const estimate = await prisma.$transaction(async (tx) => {
    if (totals) {
      await tx.estimateItem.deleteMany({ where: { estimateId } });
    }

    return tx.estimate.update({
      where: { id: estimateId },
      data: {
        title: input.title ?? undefined,
        introText: input.introText ?? undefined,
        scopeSummary: input.scopeSummary ?? undefined,
        notes: input.notes ?? undefined,
        terms: input.terms ?? undefined,
        validUntil: input.validUntil ? new Date(input.validUntil) : input.validUntil === null ? null : undefined,
        subtotal: totals?.subtotal,
        tax: totals?.tax,
        total: totals?.total,
        items: totals
          ? {
              create: totals.items
            }
          : undefined
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } }
      }
    });
  });

  await logActivity({
    companyId: existing.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_updated",
    metadata: {
      changedItems: totals?.items.length ?? 0
    }
  });

  return estimate;
}

export async function scheduleEstimateFollowUp(estimateId: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId }
  });

  if (
    estimate.status !== EstimateStatus.SENT ||
    !estimate.sentAt
  ) {
    return null;
  }

  const existing = await prisma.estimateFollowUp.findFirst({
    where: {
      companyId: estimate.companyId,
      estimateId: estimate.id,
      status: "scheduled",
      canceledAt: null
    }
  });

  if (existing) {
    return existing;
  }

  const scheduledFor = new Date(estimate.sentAt);
  scheduledFor.setHours(scheduledFor.getHours() + 48);

  const followUp = await prisma.estimateFollowUp.create({
    data: {
      companyId: estimate.companyId,
      estimateId: estimate.id,
      channel: "whatsapp",
      status: "scheduled",
      reason: estimate.viewedAt ? "viewed_not_accepted" : "no_view",
      scheduledFor
    }
  });

  await queueAutomationLog({
    companyId: estimate.companyId,
    automationType: AutomationType.ESTIMATE_FOLLOWUP,
    customerId: estimate.customerId,
    relatedEntityType: "estimate_follow_up",
    relatedEntityId: followUp.id,
    scheduledFor
  });

  await logActivity({
    companyId: estimate.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_followup_scheduled",
    metadata: {
      scheduledFor: scheduledFor.toISOString()
    }
  });

  return followUp;
}

export async function cancelEstimateFollowUps(estimateId: string) {
  const pending = await prisma.estimateFollowUp.findMany({
    where: {
      estimateId,
      status: "scheduled",
      canceledAt: null
    },
    select: { id: true }
  });

  await prisma.estimateFollowUp.updateMany({
    where: {
      estimateId,
      status: "scheduled",
      canceledAt: null
    },
    data: {
      status: "canceled",
      canceledAt: new Date()
    }
  });

  await removeQueuedAutomationLogs({
    automationType: AutomationType.ESTIMATE_FOLLOWUP,
    relatedEntityType: "estimate_follow_up",
    relatedEntityIds: pending.map((item) => item.id)
  });
}

export async function sendEstimateToCustomer(estimateId: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: {
      customer: true,
      lead: {
        include: {
          whatsappThreads: {
            include: { contact: true },
            orderBy: { updatedAt: "desc" },
            take: 1
          }
        }
      },
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  const token = estimate.publicToken || crypto.randomUUID();
  const updated = await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: EstimateStatus.SENT,
      publicToken: token,
      sentAt: estimate.sentAt ?? new Date()
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  if (estimate.leadId) {
    await prisma.lead.update({
      where: { id: estimate.leadId },
      data: { status: LeadStatus.QUOTED }
    });
  }

  const thread = estimate.lead?.whatsappThreads[0];
  const link = `${getAppUrl()}/public/estimates/${token}`;
  const text = `Ciao ${estimate.customer.fullName}, ti abbiamo inviato il preventivo. Puoi vederlo qui: ${link}`;

  if (thread) {
    await persistOutboundMessage({
      companyId: estimate.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: text,
      status: WhatsAppMessageStatus.SENT
    });
  }

  await logActivity({
    companyId: estimate.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_sent",
    metadata: {
      publicToken: token,
      channel: thread ? "whatsapp" : "manual"
    }
  });

  await scheduleEstimateFollowUp(estimate.id);

  return updated;
}

export async function markEstimateViewed(publicToken: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { publicToken }
  });

  if (estimate.viewedAt) {
    return estimate;
  }

  const updated = await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: estimate.status === EstimateStatus.SENT ? EstimateStatus.VIEWED : estimate.status,
      viewedAt: new Date()
    }
  });

  await logActivity({
    companyId: estimate.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_viewed"
  });

  return updated;
}

export async function acceptEstimate(publicToken: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { publicToken }
  });

  const updated = await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: EstimateStatus.ACCEPTED,
      acceptedAt: estimate.acceptedAt ?? new Date(),
      rejectedAt: null
    }
  });

  if (estimate.leadId) {
    await prisma.lead.update({
      where: { id: estimate.leadId },
      data: { status: LeadStatus.WON }
    });
  }

  await cancelEstimateFollowUps(estimate.id);

  await logActivity({
    companyId: estimate.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_accepted"
  });

  return updated;
}

export async function rejectEstimate(publicToken: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { publicToken }
  });

  const updated = await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status: EstimateStatus.REJECTED,
      rejectedAt: estimate.rejectedAt ?? new Date(),
      acceptedAt: null
    }
  });

  if (estimate.leadId) {
    await prisma.lead.update({
      where: { id: estimate.leadId },
      data: { status: LeadStatus.LOST }
    });
  }

  await cancelEstimateFollowUps(estimate.id);

  await logActivity({
    companyId: estimate.companyId,
    entityType: "estimate",
    entityId: estimate.id,
    eventType: "estimate_rejected"
  });

  return updated;
}

export async function getPendingEstimateFollowUps() {
  return prisma.estimateFollowUp.findMany({
    where: {
      status: "scheduled",
      canceledAt: null
    },
    include: {
      estimate: {
        include: {
          customer: true,
          lead: {
            include: {
              whatsappThreads: {
                include: { contact: true },
                orderBy: { updatedAt: "desc" },
                take: 1
              }
            }
          }
        }
      }
    }
  });
}

export async function sendDueEstimateFollowUps() {
  const queued = await prisma.estimateFollowUp.findMany({
    where: {
      status: "scheduled",
      canceledAt: null,
      scheduledFor: { lte: new Date() }
    },
    include: {
      estimate: {
        include: {
          customer: true,
          lead: {
            include: {
              whatsappThreads: {
                include: { contact: true },
                orderBy: { updatedAt: "desc" },
                take: 1
              }
            }
          }
        }
      }
    }
  });

  for (const item of queued) {
    const estimate = item.estimate;

    if (
      !estimate ||
      estimate.status === EstimateStatus.ACCEPTED ||
      estimate.status === EstimateStatus.REJECTED ||
      estimate.status === EstimateStatus.EXPIRED
    ) {
      await prisma.estimateFollowUp.update({
        where: { id: item.id },
        data: {
          status: "canceled",
          canceledAt: new Date()
        }
      });
      await removeQueuedAutomationLogs({
        automationType: AutomationType.ESTIMATE_FOLLOWUP,
        relatedEntityType: "estimate_follow_up",
        relatedEntityIds: [item.id]
      });
      continue;
    }

    const thread = estimate.lead?.whatsappThreads[0];
    const link = `${getAppUrl()}/public/estimates/${estimate.publicToken}`;
    const text =
      item.reason === "viewed_not_accepted"
        ? `Ciao ${estimate.customer.fullName}, volevamo sapere se hai domande sul preventivo. Se vuoi, possiamo sentirci per chiarimenti. ${link}`
        : `Ciao ${estimate.customer.fullName}, hai avuto modo di vedere il preventivo? Se vuoi, possiamo chiarire qualsiasi dubbio. ${link}`;

    if (!thread) {
      await prisma.estimateFollowUp.update({
        where: { id: item.id },
        data: { status: "failed" }
      });
      await markAutomationFailed({
        automationType: AutomationType.ESTIMATE_FOLLOWUP,
        relatedEntityType: "estimate_follow_up",
        relatedEntityId: item.id,
        errorMessage: "Nessun thread WhatsApp collegato al lead del preventivo."
      });
      continue;
    }

    await persistOutboundMessage({
      companyId: estimate.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: text,
      status: WhatsAppMessageStatus.SENT
    });

    await prisma.estimateFollowUp.update({
      where: { id: item.id },
      data: { status: "sent", sentAt: new Date() }
    });
    await markAutomationSent({
      automationType: AutomationType.ESTIMATE_FOLLOWUP,
      relatedEntityType: "estimate_follow_up",
      relatedEntityId: item.id
    });

    await logActivity({
      companyId: estimate.companyId,
      entityType: "estimate",
      entityId: estimate.id,
      eventType: "estimate_followup_sent"
    });
  }

  return queued.length;
}

export async function sendEstimateFollowUpNow(estimateId: string) {
  await scheduleEstimateFollowUp(estimateId);
  await prisma.estimateFollowUp.updateMany({
    where: {
      estimateId,
      status: "scheduled",
      canceledAt: null
    },
    data: {
      scheduledFor: new Date()
    }
  });

  await sendDueEstimateFollowUps();
}

export async function snoozeEstimateFollowUp(estimateId: string, hours = 24) {
  const followUp = await prisma.estimateFollowUp.findFirst({
    where: {
      estimateId,
      status: "scheduled",
      canceledAt: null
    },
    orderBy: { scheduledFor: "asc" }
  });

  if (!followUp) {
    return null;
  }

  const scheduledFor = new Date(followUp.scheduledFor);
  scheduledFor.setHours(scheduledFor.getHours() + hours);

  return prisma.estimateFollowUp.update({
    where: { id: followUp.id },
    data: { scheduledFor }
  });
}

export async function computeFunnelMetrics() {
  const company = await getDefaultCompany();
  const [leads, jobs, estimates] = await Promise.all([
    prisma.lead.findMany({ where: { companyId: company.id } }),
    prisma.job.findMany({ where: { companyId: company.id } }),
    prisma.estimate.findMany({ where: { companyId: company.id } })
  ]);

  return {
    leadsReceived: leads.length,
    leadsQualified: leads.filter((lead) => lead.qualificationStatus === "QUALIFIED").length,
    visitsConfirmed: jobs.filter((job) => job.type === "ESTIMATE_VISIT").length,
    visitsCompleted: jobs.filter((job) => job.completionStatus === "COMPLETED").length,
    estimatesCreated: estimates.length,
    estimatesSent: estimates.filter((estimate) => Boolean(estimate.sentAt)).length,
    estimatesViewed: estimates.filter((estimate) => Boolean(estimate.viewedAt)).length,
    estimatesAccepted: estimates.filter((estimate) => Boolean(estimate.acceptedAt)).length
  };
}

function averageHours(items: number[]) {
  if (!items.length) {
    return null;
  }

  return Number((items.reduce((sum, value) => sum + value, 0) / items.length).toFixed(1));
}

export async function computeOperationalMetrics() {
  const company = await getDefaultCompany();
  const [leads, jobs, estimates] = await Promise.all([
    prisma.lead.findMany({ where: { companyId: company.id } }),
    prisma.job.findMany({ where: { companyId: company.id, type: "ESTIMATE_VISIT" } }),
    prisma.estimate.findMany({ where: { companyId: company.id } })
  ]);

  return {
    avgLeadToQualificationHours: averageHours(
      leads
        .filter((lead) => lead.qualifiedAt)
        .map((lead) => (lead.qualifiedAt!.getTime() - lead.createdAt.getTime()) / 36e5)
    ),
    avgLeadToVisitConfirmationHours: averageHours(
      jobs
        .filter((job) => job.leadId)
        .map((job) => {
          const lead = leads.find((item) => item.id === job.leadId);
          return lead ? (job.startAt.getTime() - lead.createdAt.getTime()) / 36e5 : null;
        })
        .filter((value): value is number => value !== null)
    ),
    avgVisitCompletedToEstimateSentHours: averageHours(
      estimates
        .filter((estimate) => estimate.jobId && estimate.sentAt)
        .map((estimate) => {
          const job = jobs.find((item) => item.id === estimate.jobId);
          return job?.completedAt ? (estimate.sentAt!.getTime() - job.completedAt.getTime()) / 36e5 : null;
        })
        .filter((value): value is number => value !== null)
    ),
    avgEstimateSentToViewedHours: averageHours(
      estimates
        .filter((estimate) => estimate.sentAt && estimate.viewedAt)
        .map((estimate) => (estimate.viewedAt!.getTime() - estimate.sentAt!.getTime()) / 36e5)
    )
  };
}

export async function getFollowUpWorklist() {
  const company = await getDefaultCompany();
  const estimates = await prisma.estimate.findMany({
    where: {
      companyId: company.id,
      sentAt: { not: null },
      acceptedAt: null,
      rejectedAt: null
    },
    include: {
      customer: true,
      followUps: {
        orderBy: { scheduledFor: "asc" }
      }
    },
    orderBy: { sentAt: "asc" }
  });

  return estimates.map((estimate) => {
    const activeFollowUp = estimate.followUps.find((followUp) => !followUp.canceledAt);
    const isDue =
      !estimate.viewedAt &&
      activeFollowUp?.status === "scheduled" &&
      activeFollowUp.scheduledFor <= new Date();

    return {
      estimateId: estimate.id,
      customerName: estimate.customer.fullName,
      total: estimate.total,
      sentAt: estimate.sentAt!.toISOString(),
      viewedAt: estimate.viewedAt?.toISOString() ?? null,
      followUpStatus: isDue
        ? "due"
        : activeFollowUp?.status === "failed"
          ? "failed"
          : activeFollowUp?.status === "sent"
            ? "sent"
            : "scheduled",
      recommendation: estimate.viewedAt ? "call_customer" : isDue ? "follow_up_now" : "wait"
    };
  });
}

export async function getEstimateTemplates(companyId?: string) {
  const company = companyId
    ? await prisma.company.findUniqueOrThrow({ where: { id: companyId } })
    : await getDefaultCompany();

  return prisma.estimateTemplate.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" }
  });
}

export async function createEstimateTemplate(input: {
  companyId?: string;
  name: string;
  serviceType?: string | null;
  introText?: string | null;
  scopeSummary?: string | null;
  notes?: string | null;
  terms?: string | null;
  itemsJson: EstimateItemInput[];
}) {
  const company = input.companyId
    ? await prisma.company.findUniqueOrThrow({ where: { id: input.companyId } })
    : await getDefaultCompany();

  return prisma.estimateTemplate.create({
    data: {
      companyId: company.id,
      name: input.name,
      serviceType: input.serviceType ?? undefined,
      introText: input.introText ?? undefined,
      scopeSummary: input.scopeSummary ?? undefined,
      notes: input.notes ?? undefined,
      terms: input.terms ?? undefined,
      itemsJson: toJsonValue(normalizeItems(input.itemsJson))
    }
  });
}

export async function updateEstimateTemplate(
  templateId: string,
  input: {
    name?: string;
    serviceType?: string | null;
    introText?: string | null;
    scopeSummary?: string | null;
    notes?: string | null;
    terms?: string | null;
    active?: boolean;
    itemsJson?: EstimateItemInput[];
  }
) {
  return prisma.estimateTemplate.update({
    where: { id: templateId },
    data: {
      name: input.name,
      serviceType: input.serviceType ?? undefined,
      introText: input.introText ?? undefined,
      scopeSummary: input.scopeSummary ?? undefined,
      notes: input.notes ?? undefined,
      terms: input.terms ?? undefined,
      active: input.active,
      itemsJson: input.itemsJson ? toJsonValue(normalizeItems(input.itemsJson)) : undefined
    }
  });
}

export async function getEstimatePageData() {
  const company = await getDefaultCompany();
  const [estimates, templates] = await Promise.all([
    prisma.estimate.findMany({
      where: { companyId: company.id },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
        followUps: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.estimateTemplate.findMany({
      where: { companyId: company.id, active: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return { company, estimates, templates };
}

export async function getJobDetailData(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: {
      customer: true,
      assignedUser: true,
      lead: {
        include: {
          whatsappThreads: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: {
              messages: {
                where: {
                  storagePath: {
                    not: null
                  }
                },
                orderBy: { createdAt: "asc" }
              }
            }
          }
        }
      },
      estimates: {
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function getPublicEstimateData(publicToken: string) {
  return prisma.estimate.findUnique({
    where: { publicToken },
    include: {
      company: true,
      customer: true,
      items: { orderBy: { sortOrder: "asc" } }
    }
  });
}
