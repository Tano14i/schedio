import type { Estimate, Lead } from "@/lib/types";

export function updateLeadAfterScheduling(lead: Lead, kind: "estimate_visit" | "job"): Lead {
  if (kind === "job") {
    return {
      ...lead,
      status: "won",
      nextAction: "Aprire lavoro e confermare dettagli"
    };
  }

  return {
    ...lead,
    status: "scheduled",
    nextAction: "Aprire appuntamento e confermare dettagli"
  };
}

export function updateLeadAfterEstimateSent(lead: Lead): Lead {
  return {
    ...lead,
    status: "quoted",
    nextAction: "Attendere risposta o fare follow-up preventivo"
  };
}

export function updateLeadAfterWhatsAppProposalSent(lead: Lead): Lead {
  return {
    ...lead,
    status: "contacted",
    nextAction: "Attendere conferma data/ora sopralluogo"
  };
}

export function updateLeadAfterEstimateDecision(
  lead: Lead,
  decision: "accepted" | "rejected"
): Lead {
  if (decision === "accepted") {
    return {
      ...lead,
      status: "won",
      nextAction: "Pianificare data lavoro"
    };
  }

  return {
    ...lead,
    status: "lost",
    nextAction: "Nessuna azione automatica in corso"
  };
}

export function updateEstimateStatus(
  estimate: Estimate,
  status: "sent" | "accepted" | "rejected"
): Estimate {
  const now = new Date().toISOString();

  if (status === "sent") {
    return {
      ...estimate,
      status,
      sentAt: estimate.sentAt ?? now
    };
  }

  if (status === "accepted") {
    return {
      ...estimate,
      status,
      acceptedAt: now
    };
  }

  return {
    ...estimate,
    status
  };
}
