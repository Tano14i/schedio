import type { ActivityLog, Invoice } from "@/lib/types";

export type ReviewRequestRecord = {
  id: string;
  customerId: string;
  jobId?: string;
  invoiceId?: string;
  sentAt: string;
  status: "pending" | "sent" | "clicked";
  channel: "sms" | "email";
};

export function createActivityLog(
  entityType: ActivityLog["entityType"],
  entityId: string,
  eventType: string,
  message: string
): ActivityLog {
  return {
    id: `act_${crypto.randomUUID()}`,
    entityType,
    entityId,
    eventType,
    message,
    createdAt: new Date().toISOString()
  };
}

export function createReviewRequest(input: {
  customerId: string;
  jobId?: string;
  invoiceId?: string;
  channel?: "sms" | "email";
}): ReviewRequestRecord {
  return {
    id: `review_${crypto.randomUUID()}`,
    customerId: input.customerId,
    jobId: input.jobId,
    invoiceId: input.invoiceId,
    sentAt: new Date().toISOString(),
    status: "sent",
    channel: input.channel ?? "sms"
  };
}

export function markInvoicePaid(invoice: Invoice): Invoice {
  return {
    ...invoice,
    status: "paid",
    paidAt: new Date().toISOString()
  };
}
