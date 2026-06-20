export type P0ThreadStatus =
  | "OPEN"
  | "WAITING_PHOTOS"
  | "WAITING_INTERNAL_APPROVAL"
  | "WAITING_CUSTOMER_CONFIRMATION"
  | "CLOSED";

export type P0SchedulingProposalStatus =
  | "DRAFT"
  | "PENDING_HANDYMAN_APPROVAL"
  | "APPROVED"
  | "SENT_TO_CUSTOMER"
  | "CUSTOMER_CONFIRMED"
  | "EXPIRED"
  | "REJECTED";

export function shouldConvertThreadToLead(input: {
  leadId?: string | null;
  textMessageCount: number;
  imageMessageCount: number;
}) {
  if (input.leadId) {
    return false;
  }

  return input.textMessageCount > 0 && input.imageMessageCount > 0;
}

export function getThreadStatusAfterInbound(input: {
  currentStatus: P0ThreadStatus;
  messageType: "text" | "interactive" | "image";
  hasLead: boolean;
}) {
  if (input.messageType === "image") {
    return input.hasLead ? "WAITING_INTERNAL_APPROVAL" : "WAITING_PHOTOS";
  }

  if (input.currentStatus === "OPEN") {
    return "WAITING_PHOTOS";
  }

  return input.currentStatus;
}

export function canCreateJobFromProposalStatus(status: P0SchedulingProposalStatus) {
  return status === "CUSTOMER_CONFIRMED";
}
