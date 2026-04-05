import {
  AutomationType,
  InvoiceReminderReason,
  InvoiceReminderStatus,
  InvoiceStatus,
  Prisma,
  ReviewRequestStatus,
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
import {
  buildInvoiceReminderAiAssist,
  buildReviewRequestAiAssist
} from "@/lib/ai-followups";
import {
  getInvoiceReminderReason,
  sendInvoiceState,
  sendReviewRequestState,
  shouldScheduleInvoiceReminder,
  shouldScheduleReviewRequest,
  shouldSendInvoiceReminder
} from "@/lib/invoice-lifecycle";
import { persistOutboundMessage } from "@/lib/whatsapp-server";

type InvoiceItemInput = {
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

function normalizeItems(items: InvoiceItemInput[]) {
  return items.map((item, index) => ({
    label: item.label,
    description: item.description ?? undefined,
    qty: normalizeNumber(item.qty),
    unitPrice: normalizeNumber(item.unitPrice),
    sortOrder: item.sortOrder ?? index + 1
  }));
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

async function nextInvoiceNumber(companyId: string) {
  const count = await prisma.invoice.count({ where: { companyId } });
  return `INV-2026-${String(count + 1).padStart(3, "0")}`;
}

export function calculateInvoiceTotals(items: InvoiceItemInput[], taxRate = 0) {
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

function buildInvoiceItemsFromEstimate(
  items: Array<{ label: string; description: string | null; qty: number; unitPrice: number; sortOrder: number }>
) {
  return items.map((item) => ({
    label: item.label,
    description: item.description ?? undefined,
    qty: item.qty,
    unitPrice: item.unitPrice,
    sortOrder: item.sortOrder
  }));
}

async function findLatestThreadByLead(leadId?: string | null) {
  if (!leadId) {
    return null;
  }

  return prisma.whatsAppThread.findFirst({
    where: { leadId },
    include: { contact: true },
    orderBy: { updatedAt: "desc" }
  });
}

export async function createInvoiceDraftFromEstimate(estimateId: string) {
  const estimate = await prisma.estimate.findUniqueOrThrow({
    where: { id: estimateId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      lead: true,
      job: true,
      invoices: {
        where: { status: { not: InvoiceStatus.VOID } },
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (estimate.status !== "ACCEPTED") {
    throw new Error("La fattura si crea solo da un preventivo accettato.");
  }

  if (estimate.invoices[0]) {
    return estimate.invoices[0];
  }

  const number = await nextInvoiceNumber(estimate.companyId);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const totals = calculateInvoiceTotals(buildInvoiceItemsFromEstimate(estimate.items));

  const invoice = await prisma.invoice.create({
    data: {
      companyId: estimate.companyId,
      customerId: estimate.customerId,
      leadId: estimate.leadId,
      jobId: estimate.jobId,
      estimateId: estimate.id,
      number,
      status: InvoiceStatus.DRAFT,
      title: estimate.title ? `Fattura ${estimate.title}` : `Fattura ${estimate.number}`,
      notes: estimate.notes ?? undefined,
      terms: estimate.terms ?? "Pagamento a fine lavoro.",
      dueDate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      publicToken: crypto.randomUUID(),
      items: {
        create: totals.items
      }
    },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      reminders: { orderBy: { createdAt: "desc" } },
      reviewRequests: { orderBy: { createdAt: "desc" } }
    }
  });

  await logActivity({
    companyId: estimate.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_draft_created",
    metadata: {
      estimateId: estimate.id
    }
  });

  return invoice;
}

export async function createInvoiceDraftFromJob(jobId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      customer: true,
      lead: true,
      invoices: {
        where: { status: { not: InvoiceStatus.VOID } },
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (job.completionStatus !== "COMPLETED") {
    throw new Error("La fattura si crea solo da un lavoro completato.");
  }

  if (job.invoices[0]) {
    return job.invoices[0];
  }

  const number = await nextInvoiceNumber(job.companyId);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const totals = calculateInvoiceTotals([
    {
      label: job.title,
      description: job.completionNotes ?? job.notes ?? job.lead?.description ?? "Intervento completato",
      qty: 1,
      unitPrice: 0
    }
  ]);

  const invoice = await prisma.invoice.create({
    data: {
      companyId: job.companyId,
      customerId: job.customerId,
      leadId: job.leadId,
      jobId: job.id,
      number,
      status: InvoiceStatus.DRAFT,
      title: `Fattura ${job.title}`,
      notes: job.completionNotes ?? job.notes ?? undefined,
      terms: "Pagamento a fine lavoro.",
      dueDate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      publicToken: crypto.randomUUID(),
      items: {
        create: totals.items
      }
    },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      reminders: { orderBy: { createdAt: "desc" } },
      reviewRequests: { orderBy: { createdAt: "desc" } }
    }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_draft_created",
    metadata: {
      jobId: job.id
    }
  });

  return invoice;
}

export async function updateInvoice(
  invoiceId: string,
  input: {
    title?: string | null;
    notes?: string | null;
    terms?: string | null;
    dueDate?: string | null;
    items?: InvoiceItemInput[];
  }
) {
  const existing = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }
  });
  const totals = input.items ? calculateInvoiceTotals(input.items) : null;

  const invoice = await prisma.$transaction(async (tx) => {
    if (totals) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId } });
    }

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        title: input.title ?? undefined,
        notes: input.notes ?? undefined,
        terms: input.terms ?? undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
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
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
        reminders: { orderBy: { createdAt: "desc" } },
        reviewRequests: { orderBy: { createdAt: "desc" } }
      }
    });
  });

  await logActivity({
    companyId: existing.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_updated"
  });

  return invoice;
}

export async function scheduleInvoiceReminder(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }
  });

  if (!shouldScheduleInvoiceReminder({
    status: invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "void",
    dueDate: invoice.dueDate?.toISOString(),
    paidAt: invoice.paidAt?.toISOString()
  })) {
    return null;
  }

  const existing = await prisma.invoiceReminder.findFirst({
    where: {
      invoiceId,
      status: InvoiceReminderStatus.SCHEDULED,
      canceledAt: null
    }
  });

  if (existing) {
    return existing;
  }

  const scheduledFor = new Date(invoice.dueDate!);
  scheduledFor.setDate(scheduledFor.getDate() + 3);

  const reminder = await prisma.invoiceReminder.create({
    data: {
      companyId: invoice.companyId,
      invoiceId: invoice.id,
      channel: "whatsapp",
      scheduledFor,
      status: InvoiceReminderStatus.SCHEDULED,
      reason: getInvoiceReminderReason({
        dueDate: invoice.dueDate?.toISOString()
      }) === "before_due"
        ? InvoiceReminderReason.BEFORE_DUE
        : InvoiceReminderReason.OVERDUE
    }
  });

  await queueAutomationLog({
    companyId: invoice.companyId,
    automationType: AutomationType.INVOICE_REMINDER,
    customerId: invoice.customerId,
    relatedEntityType: "invoice_reminder",
    relatedEntityId: reminder.id,
    scheduledFor
  });

  await logActivity({
    companyId: invoice.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_reminder_scheduled",
    metadata: {
      scheduledFor: scheduledFor.toISOString()
    }
  });

  return reminder;
}

export async function cancelInvoiceReminders(invoiceId: string) {
  const pending = await prisma.invoiceReminder.findMany({
    where: {
      invoiceId,
      status: InvoiceReminderStatus.SCHEDULED,
      canceledAt: null
    },
    select: { id: true }
  });

  await prisma.invoiceReminder.updateMany({
    where: {
      invoiceId,
      status: InvoiceReminderStatus.SCHEDULED,
      canceledAt: null
    },
    data: {
      status: InvoiceReminderStatus.CANCELED,
      canceledAt: new Date()
    }
  });

  await removeQueuedAutomationLogs({
    automationType: AutomationType.INVOICE_REMINDER,
    relatedEntityType: "invoice_reminder",
    relatedEntityIds: pending.map((item) => item.id)
  });
}

export async function sendInvoiceToCustomer(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  const thread = await findLatestThreadByLead(invoice.leadId);
  const state = sendInvoiceState({
    status: invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "void",
    publicToken: invoice.publicToken,
    sentAt: invoice.sentAt?.toISOString()
  });

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: InvoiceStatus.SENT,
      publicToken: state.publicToken === "generate" ? crypto.randomUUID() : state.publicToken,
      sentAt: invoice.sentAt ?? new Date()
    },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      reminders: { orderBy: { createdAt: "desc" } },
      reviewRequests: { orderBy: { createdAt: "desc" } }
    }
  });

  const link = `${getAppUrl()}/public/invoices/${updated.publicToken}`;
  if (thread) {
    await persistOutboundMessage({
      companyId: invoice.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: `Ciao ${invoice.customer.fullName}, ecco la fattura ${updated.number}: ${link}`,
      status: WhatsAppMessageStatus.SENT
    });
  }

  await scheduleInvoiceReminder(updated.id);

  await logActivity({
    companyId: invoice.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_sent",
    metadata: {
      publicToken: updated.publicToken
    }
  });

  return updated;
}

export async function markInvoiceViewed(publicToken: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { publicToken }
  });

  if (invoice.viewedAt) {
    return invoice;
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { viewedAt: new Date() }
  });

  await logActivity({
    companyId: invoice.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_viewed"
  });

  return updated;
}

export async function scheduleReviewRequest(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }
  });

  if (!shouldScheduleReviewRequest({
    status: invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "void",
    paidAt: invoice.paidAt?.toISOString()
  })) {
    return null;
  }

  const existing = await prisma.reviewRequest.findFirst({
    where: {
      invoiceId,
      status: {
        in: [ReviewRequestStatus.PENDING, ReviewRequestStatus.SENT]
      }
    }
  });

  if (existing) {
    return existing;
  }

  const scheduledFor = new Date(invoice.paidAt!);
  scheduledFor.setHours(scheduledFor.getHours() + 24);

  const request = await prisma.reviewRequest.create({
    data: {
      companyId: invoice.companyId,
      customerId: invoice.customerId,
      jobId: invoice.jobId,
      invoiceId: invoice.id,
      channel: "whatsapp",
      reviewLink: "https://g.page/r/demo-review-link",
      scheduledFor,
      status: ReviewRequestStatus.PENDING
    }
  });

  await queueAutomationLog({
    companyId: invoice.companyId,
    automationType: AutomationType.REVIEW_REQUEST,
    customerId: invoice.customerId,
    relatedEntityType: "review_request",
    relatedEntityId: request.id,
    scheduledFor
  });

  await logActivity({
    companyId: invoice.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "review_request_scheduled",
    metadata: {
      reviewRequestId: request.id,
      scheduledFor: scheduledFor.toISOString()
    }
  });

  return request;
}

export async function markInvoicePaid(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId }
  });

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paidAt: invoice.paidAt ?? new Date()
    },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      reminders: { orderBy: { createdAt: "desc" } },
      reviewRequests: { orderBy: { createdAt: "desc" } }
    }
  });

  await cancelInvoiceReminders(invoice.id);
  await scheduleReviewRequest(invoice.id);

  await logActivity({
    companyId: invoice.companyId,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "invoice_paid"
  });

  return updated;
}

export async function getPendingInvoiceReminders() {
  return prisma.invoiceReminder.findMany({
    where: {
      status: InvoiceReminderStatus.SCHEDULED,
      canceledAt: null
    },
    include: {
      invoice: {
        include: {
          customer: true
        }
      }
    }
  });
}

export async function sendDueInvoiceReminders() {
  const queued = await prisma.invoiceReminder.findMany({
    where: {
      status: InvoiceReminderStatus.SCHEDULED,
      canceledAt: null,
      scheduledFor: { lte: new Date() }
    },
    include: {
      invoice: {
        include: {
          customer: true
        }
      }
    }
  });

  for (const reminder of queued) {
    const invoice = reminder.invoice;
    if (
      !invoice ||
      !shouldSendInvoiceReminder({
        status: invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "void",
        dueDate: invoice.dueDate?.toISOString(),
        paidAt: invoice.paidAt?.toISOString()
      })
    ) {
      await prisma.invoiceReminder.update({
        where: { id: reminder.id },
        data: {
          status: InvoiceReminderStatus.CANCELED,
          canceledAt: new Date()
        }
      });
      continue;
    }

    const thread = await findLatestThreadByLead(invoice.leadId);
    if (!thread) {
      await prisma.invoiceReminder.update({
        where: { id: reminder.id },
        data: {
          status: InvoiceReminderStatus.FAILED
        }
      });
      await markAutomationFailed({
        automationType: AutomationType.INVOICE_REMINDER,
        relatedEntityType: "invoice_reminder",
        relatedEntityId: reminder.id,
        errorMessage: "Nessun thread WhatsApp collegato al lead della fattura."
      });
      continue;
    }

    const assist = await buildInvoiceReminderAiAssist({
      customerName: invoice.customer.fullName,
      invoiceNumber: invoice.number,
      total: invoice.total,
      dueDate: invoice.dueDate,
      publicUrl: invoice.publicToken ? `${getAppUrl()}/public/invoices/${invoice.publicToken}` : null,
      reason: reminder.reason.toLowerCase()
    });

    await persistOutboundMessage({
      companyId: invoice.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: assist.message,
      status: WhatsAppMessageStatus.SENT
    });

    await prisma.invoiceReminder.update({
      where: { id: reminder.id },
      data: {
        status: InvoiceReminderStatus.SENT,
        sentAt: new Date()
      }
    });
    await markAutomationSent({
      automationType: AutomationType.INVOICE_REMINDER,
      relatedEntityType: "invoice_reminder",
      relatedEntityId: reminder.id
    });

    await logActivity({
      companyId: invoice.companyId,
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "invoice_reminder_sent",
      metadata: {
        aiSource: assist.source,
        scenario: assist.scenario
      }
    });
  }

  return queued.length;
}

export async function sendReviewRequestNow(reviewRequestId: string) {
  const request = await prisma.reviewRequest.findUniqueOrThrow({
    where: { id: reviewRequestId },
    include: {
      customer: true,
      invoice: true
    }
  });

  const state = sendReviewRequestState(request.status.toLowerCase() as "pending" | "sent" | "clicked" | "canceled");
  if (!state.changed) {
    return request;
  }

  const thread = await findLatestThreadByLead(request.invoice?.leadId);
  const assist = await buildReviewRequestAiAssist({
    customerName: request.customer.fullName,
    reviewLink: request.reviewLink,
    workSummary: request.invoice?.title
  });
  if (thread) {
    await persistOutboundMessage({
      companyId: request.companyId,
      contactId: thread.contactId,
      threadId: thread.id,
      type: WhatsAppMessageType.TEXT,
      textBody: assist.message,
      status: WhatsAppMessageStatus.SENT
    });
  } else {
    const nextAttempt = new Date();
    nextAttempt.setHours(nextAttempt.getHours() + 24);
    await prisma.reviewRequest.update({
      where: { id: request.id },
      data: {
        scheduledFor: nextAttempt
      }
    });
    await markAutomationFailed({
      automationType: AutomationType.REVIEW_REQUEST,
      relatedEntityType: "review_request",
      relatedEntityId: request.id,
      errorMessage: "Nessun thread WhatsApp collegato per inviare la review request."
    });
    return request;
  }

  const updated = await prisma.reviewRequest.update({
    where: { id: request.id },
    data: {
      status: ReviewRequestStatus.SENT,
      sentAt: new Date()
    }
  });
  await markAutomationSent({
    automationType: AutomationType.REVIEW_REQUEST,
    relatedEntityType: "review_request",
    relatedEntityId: request.id
  });

  await logActivity({
    companyId: request.companyId,
    entityType: "invoice",
    entityId: request.invoiceId ?? request.id,
    eventType: "review_request_sent",
    metadata: {
      aiSource: assist.source
    }
  });

  return updated;
}

export async function cancelReviewRequest(reviewRequestId: string) {
  await removeQueuedAutomationLogs({
    automationType: AutomationType.REVIEW_REQUEST,
    relatedEntityType: "review_request",
    relatedEntityIds: [reviewRequestId]
  });

  return prisma.reviewRequest.update({
    where: { id: reviewRequestId },
    data: {
      status: ReviewRequestStatus.CANCELED
    }
  });
}

export async function sendDueReviewRequests() {
  const queued = await prisma.reviewRequest.findMany({
    where: {
      status: ReviewRequestStatus.PENDING,
      scheduledFor: { lte: new Date() }
    }
  });

  for (const request of queued) {
    await sendReviewRequestNow(request.id);
  }

  return queued.length;
}

export async function getInvoiceMetrics() {
  const company = await getDefaultCompany();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [invoices, reviewRequests] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId: company.id }
    }),
    prisma.reviewRequest.findMany({
      where: { companyId: company.id }
    })
  ]);

  const openInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.SENT).length;
  const overdueInvoices = invoices.filter(
    (invoice) =>
      invoice.status !== InvoiceStatus.PAID &&
      invoice.status !== InvoiceStatus.VOID &&
      invoice.dueDate &&
      invoice.dueDate < now
  ).length;
  const paidInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.PAID).length;
  const cashCollectedMonth = invoices
    .filter((invoice) => invoice.paidAt && invoice.paidAt >= startOfMonth)
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const timeToPaid = invoices
    .filter((invoice) => invoice.sentAt && invoice.paidAt)
    .map((invoice) => (invoice.paidAt!.getTime() - invoice.sentAt!.getTime()) / 36e5);

  return {
    openInvoices,
    overdueInvoices,
    paidInvoices,
    cashCollectedMonth: Number(cashCollectedMonth.toFixed(2)),
    reviewRequestsSent: reviewRequests.filter((item) => item.status === ReviewRequestStatus.SENT || item.status === ReviewRequestStatus.CLICKED).length,
    reviewRequestsClicked: reviewRequests.filter((item) => item.status === ReviewRequestStatus.CLICKED).length,
    avgInvoiceSentToPaidHours: timeToPaid.length
      ? Number((timeToPaid.reduce((sum, value) => sum + value, 0) / timeToPaid.length).toFixed(1))
      : null
  };
}

export async function getInvoiceWorklist() {
  const company = await getDefaultCompany();
  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id },
    include: {
      customer: true,
      reminders: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      reviewRequests: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
  });

  const now = new Date();

  return invoices
    .filter((invoice) => {
      const review = invoice.reviewRequests[0];
      const reminder = invoice.reminders[0];
      const dueReminder =
        reminder?.status === InvoiceReminderStatus.SCHEDULED &&
        reminder.scheduledFor <= now &&
        !reminder.canceledAt;
      return (
        invoice.status === InvoiceStatus.SENT && (!invoice.paidAt || dueReminder)
      );
    })
    .map((invoice) => {
      const reminder = invoice.reminders[0];
      const dueReminder =
        reminder?.status === InvoiceReminderStatus.SCHEDULED &&
        reminder.scheduledFor <= now &&
        !reminder.canceledAt;

      return {
        invoiceId: invoice.id,
        customerName: invoice.customer.fullName,
        number: invoice.number,
        total: invoice.total,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        sentAt: invoice.sentAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        reminderStatus: dueReminder
          ? "due"
          : reminder
            ? reminder.status.toLowerCase()
            : "none",
        recommendation: dueReminder
            ? "send_reminder"
            : invoice.status === InvoiceStatus.SENT
              ? "mark_paid"
              : "send_invoice"
      };
    });
}

export async function getInvoicePageData() {
  const company = await getDefaultCompany();
  const [invoices, customers, reviewRequests] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId: company.id },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
        reminders: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        reviewRequests: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.customer.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.reviewRequest.findMany({
      where: { companyId: company.id },
      include: {
        customer: true,
        invoice: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return { company, invoices, customers, reviewRequests };
}

export async function getPublicInvoiceData(publicToken: string) {
  return prisma.invoice.findUnique({
    where: { publicToken },
    include: {
      company: true,
      customer: true,
      items: { orderBy: { sortOrder: "asc" } }
    }
  });
}
