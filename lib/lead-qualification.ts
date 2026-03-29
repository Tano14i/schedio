import type {
  BudgetRange,
  JobSize,
  NextBestAction,
  QualificationConfidence,
  QualificationStatus,
  ServiceArea,
  ServiceAreaMatch
} from "@/lib/types";

export type QualificationReasonCode =
  | "inside_area"
  | "outside_area"
  | "missing_photos"
  | "missing_measurements"
  | "too_small"
  | "low_budget"
  | "unsupported_service"
  | "insufficient_info";

export type QualificationDecision = {
  qualificationStatus: Exclude<QualificationStatus, "unqualified">;
  nextBestAction: NextBestAction;
  reasonCode: QualificationReasonCode;
  confidence: QualificationConfidence;
  serviceAreaMatch: ServiceAreaMatch;
  missingFields: string[];
};

const SUPPORTED_SERVICES = [
  "porta",
  "tapparella",
  "rubinetto",
  "perdita",
  "mensole",
  "imbiancatura"
] as const;

const SERVICES_REQUIRING_PHOTOS = ["porta", "tapparella", "rubinetto", "perdita"] as const;
const SERVICES_REQUIRING_MEASUREMENTS = ["tapparella", "mensole"] as const;

export function evaluateLeadQualification(input: {
  serviceType: string;
  description: string;
  address?: string | null;
  photoCount: number;
  measurements?: string | null;
  jobSize?: JobSize;
  budgetRange?: BudgetRange;
  serviceAreas: ServiceArea[];
}) {
  const normalizedService = `${input.serviceType} ${input.description}`.toLowerCase();
  const serviceAreaMatch = matchServiceArea(input.address, input.serviceAreas);
  const missingFields: string[] = [];

  if (serviceAreaMatch === "outside") {
    return {
      qualificationStatus: "out_of_area",
      nextBestAction: "reject",
      reasonCode: "outside_area",
      confidence: "high",
      serviceAreaMatch,
      missingFields
    } satisfies QualificationDecision;
  }

  if (!SUPPORTED_SERVICES.some((keyword) => normalizedService.includes(keyword))) {
    return {
      qualificationStatus: "rejected",
      nextBestAction: "reject",
      reasonCode: "unsupported_service",
      confidence: "high",
      serviceAreaMatch,
      missingFields
    } satisfies QualificationDecision;
  }

  if (
    SERVICES_REQUIRING_PHOTOS.some((keyword) => normalizedService.includes(keyword)) &&
    input.photoCount === 0
  ) {
    missingFields.push("photos");
    return {
      qualificationStatus: "needs_clarification",
      nextBestAction: "ask_clarification",
      reasonCode: "missing_photos",
      confidence: "high",
      serviceAreaMatch,
      missingFields
    } satisfies QualificationDecision;
  }

  if (
    SERVICES_REQUIRING_MEASUREMENTS.some((keyword) => normalizedService.includes(keyword)) &&
    !input.measurements?.trim()
  ) {
    missingFields.push("measurements");
    return {
      qualificationStatus: "needs_clarification",
      nextBestAction: "ask_clarification",
      reasonCode: "missing_measurements",
      confidence: "medium",
      serviceAreaMatch,
      missingFields
    } satisfies QualificationDecision;
  }

  if (input.description.trim().length < 24) {
    missingFields.push("description");
    return {
      qualificationStatus: "needs_clarification",
      nextBestAction: "ask_clarification",
      reasonCode: "insufficient_info",
      confidence: "medium",
      serviceAreaMatch,
      missingFields
    } satisfies QualificationDecision;
  }

  if (
    (input.jobSize ?? "unknown") === "small" &&
    (input.budgetRange ?? "unknown") === "low"
  ) {
    return {
      qualificationStatus: "low_priority",
      nextBestAction: "defer",
      reasonCode: "too_small",
      confidence: "medium",
      serviceAreaMatch,
      missingFields
    } satisfies QualificationDecision;
  }

  return {
    qualificationStatus: "qualified",
    nextBestAction: "propose_visit",
    reasonCode: "inside_area",
    confidence: serviceAreaMatch === "inside" ? "high" : "medium",
    serviceAreaMatch,
    missingFields
  } satisfies QualificationDecision;
}

export function inferJobSize(input: { serviceType: string; description: string }): JobSize {
  const text = `${input.serviceType} ${input.description}`.toLowerCase();

  if (text.includes("imbiancatura")) {
    return "medium";
  }
  if (text.includes("mensole") || text.includes("porta") || text.includes("tapparella")) {
    return "small";
  }
  if (text.includes("bagno completo") || text.includes("ristrutturazione")) {
    return "large";
  }

  return "unknown";
}

export function matchServiceArea(address: string | null | undefined, serviceAreas: ServiceArea[]): ServiceAreaMatch {
  if (!address?.trim()) {
    return "unknown";
  }

  const normalizedAddress = address.toLowerCase();
  const isInside = serviceAreas.some((area) => {
    if (!area.active) {
      return false;
    }

    const cityMatch = area.city ? normalizedAddress.includes(area.city.toLowerCase()) : false;
    const postalMatch = area.postalCodePrefix
      ? normalizedAddress.includes(area.postalCodePrefix.toLowerCase())
      : false;

    return cityMatch || postalMatch;
  });

  return isInside ? "inside" : "outside";
}

export function toPrismaQualificationValue<T extends string>(value: T) {
  return value.toUpperCase().replaceAll(" ", "_");
}
