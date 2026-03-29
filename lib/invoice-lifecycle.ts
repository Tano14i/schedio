import type {
  InvoiceReminderReason,
  InvoiceReminderStatus,
  InvoiceStatus,
  ReviewRequestStatus
} from "@/lib/types";

export function sendInvoiceState(invoice: {
  status: InvoiceStatus;
  publicToken?: string;
  sentAt?: string;
}) {
  return {
    status: "sent" as const,
    sentAt: invoice.sentAt ?? "now",
    publicToken: invoice.publicToken || "generate"
  };
}

export function markInvoiceViewedState(invoice: {
  status: InvoiceStatus;
  viewedAt?: string;
}) {
  if (invoice.viewedAt) {
    return {
      status: invoice.status,
      viewedAt: invoice.viewedAt,
      changed: false
    };
  }

  return {
    status: invoice.status === "sent" ? ("sent" as const) : invoice.status,
    viewedAt: "now",
    changed: true
  };
}

export function markInvoicePaidState(invoice: {
  status: InvoiceStatus;
  paidAt?: string;
}) {
  return {
    status: "paid" as const,
    paidAt: invoice.paidAt ?? "now",
    reminderCancelled: true,
    scheduleReviewRequest: true
  };
}

export function shouldScheduleInvoiceReminder(invoice: {
  status: InvoiceStatus;
  dueDate?: string;
  paidAt?: string;
}) {
  return invoice.status === "sent" && Boolean(invoice.dueDate) && !invoice.paidAt;
}

export function shouldSendInvoiceReminder(invoice: {
  status: InvoiceStatus;
  paidAt?: string;
  dueDate?: string;
}) {
  return invoice.status !== "paid" && invoice.status !== "void" && Boolean(invoice.dueDate) && !invoice.paidAt;
}

export function nextInvoiceReminderState(current?: InvoiceReminderStatus) {
  if (current === "sent") {
    return "sent" as const;
  }

  return "scheduled" as const;
}

export function getInvoiceReminderReason(invoice: { dueDate?: string }) {
  return invoice.dueDate ? ("overdue" as InvoiceReminderReason) : ("before_due" as InvoiceReminderReason);
}

export function shouldScheduleReviewRequest(invoice: {
  status: InvoiceStatus;
  paidAt?: string;
}) {
  return invoice.status === "paid" && Boolean(invoice.paidAt);
}

export function sendReviewRequestState(current?: ReviewRequestStatus) {
  if (current === "sent" || current === "clicked") {
    return {
      status: current,
      sentAt: current === "sent" ? "existing" : undefined,
      changed: false
    };
  }

  return {
    status: "sent" as const,
    sentAt: "now",
    changed: true
  };
}
