export type EstimateLifecycleStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired";

export function ensureDraftIdempotent(existingEstimateId?: string | null) {
  return {
    shouldCreate: !existingEstimateId,
    estimateId: existingEstimateId ?? null
  };
}

export function sendEstimateState(input: {
  status: EstimateLifecycleStatus;
  sentAt?: string | null;
  publicToken?: string | null;
}) {
  return {
    status: "sent" as const,
    sentAt: input.sentAt ?? "now",
    publicToken: input.publicToken ?? "generate"
  };
}

export function markViewedState(input: {
  status: EstimateLifecycleStatus;
  viewedAt?: string | null;
}) {
  if (input.viewedAt) {
    return {
      status: input.status,
      viewedAt: input.viewedAt,
      changed: false
    };
  }

  return {
    status: input.status === "sent" ? ("viewed" as const) : input.status,
    viewedAt: "now",
    changed: true
  };
}

export function resolveEstimateDecision(
  action: "accept" | "reject",
  input: {
    status: EstimateLifecycleStatus;
    acceptedAt?: string | null;
    rejectedAt?: string | null;
  }
) {
  if (action === "accept") {
    return {
      status: "accepted" as const,
      acceptedAt: input.acceptedAt ?? "now",
      rejectedAt: null,
      followUpCancelled: true
    };
  }

  return {
    status: "rejected" as const,
    acceptedAt: null,
    rejectedAt: input.rejectedAt ?? "now",
    followUpCancelled: true
  };
}

export function shouldScheduleEstimateFollowUp(input: {
  status: EstimateLifecycleStatus;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
}) {
  return input.status === "sent" && !input.acceptedAt && !input.rejectedAt;
}
