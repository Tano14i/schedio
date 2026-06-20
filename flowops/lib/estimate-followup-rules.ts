export function shouldCreateAutomaticFollowUp(input: {
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  hasPendingFollowUp: boolean;
  isExpired: boolean;
}) {
  return input.status === "sent" && !input.hasPendingFollowUp && !input.isExpired;
}

export function followUpReasonForEstimate(viewedAt?: string | null) {
  return viewedAt ? "viewed_not_accepted" : "no_view";
}

export function shouldSendDueFollowUp(input: {
  followUpStatus: "scheduled" | "sent" | "canceled" | "failed";
  scheduledFor: string;
  now: string;
  estimateStatus: "sent" | "viewed" | "accepted" | "rejected" | "expired";
}) {
  return (
    input.followUpStatus === "scheduled" &&
    new Date(input.scheduledFor) <= new Date(input.now) &&
    input.estimateStatus !== "accepted" &&
    input.estimateStatus !== "rejected" &&
    input.estimateStatus !== "expired"
  );
}

export function computeSimpleFunnelMetrics(input: {
  leadsReceived: number;
  leadsQualified: number;
  visitsConfirmed: number;
  visitsCompleted: number;
  estimatesCreated: number;
  estimatesSent: number;
  estimatesViewed: number;
  estimatesAccepted: number;
}) {
  return input;
}
