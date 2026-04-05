type IntakeUrgency = "low" | "medium" | "high";
type IntakeConfidence = "low" | "medium" | "high";
type IntakeNextAction = "ask_clarification" | "schedule_visit" | "book_intervention";
type IntakeSource = "heuristic" | "openai";

export type StructuredWorkIntakeSuggestion = {
  customerName?: string;
  serviceType: string;
  address?: string;
  urgency: IntakeUrgency;
  preferredWindow?: string;
  materialsMentioned: string[];
  measurements?: string;
  visitNeeded: boolean;
  nextAction: IntakeNextAction;
  summary: string;
  missingFields: string[];
  confidence: IntakeConfidence;
  source: IntakeSource;
};

const SERVICE_PATTERNS = [
  {
    label: "Riparazione tapparella",
    keywords: ["tapparella", "cinghia", "avvolgibile", "rullo", "motore tapparella"]
  },
  {
    label: "Riparazione porta o finestra",
    keywords: ["porta", "finestra", "cerniere", "serratura", "infisso", "porta finestra"]
  },
  {
    label: "Perdita o rubinetto",
    keywords: ["perdita", "rubinetto", "lavello", "tubo", "scarico", "acqua"]
  },
  {
    label: "Montaggio mensole",
    keywords: ["mensole", "mensola", "cartongesso", "tasselli", "montaggio"]
  },
  {
    label: "Imbiancatura",
    keywords: ["imbiancatura", "vernice", "pareti", "soffitto", "stuccare"]
  },
  {
    label: "Intervento elettrico",
    keywords: ["presa", "interruttore", "luci", "lampada", "elettrico", "citofono"]
  },
  {
    label: "Intervento generico",
    keywords: []
  }
] as const;

const MATERIAL_KEYWORDS = [
  "cinghia",
  "motore",
  "cerniere",
  "serratura",
  "rubinetto",
  "silicone",
  "tasselli",
  "vernice",
  "stucco",
  "tubo",
  "kit viti",
  "guarnizione"
] as const;

const HIGH_URGENCY_KEYWORDS = [
  "urgente",
  "subito",
  "oggi",
  "entro oggi",
  "domani",
  "bloccata",
  "bloccato",
  "perdita",
  "acqua",
  "rotto"
] as const;

const LOW_URGENCY_KEYWORDS = ["senza fretta", "quando puoi", "quando potete", "settimana prossima"] as const;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function findServiceType(text: string) {
  const normalized = text.toLowerCase();

  for (const service of SERVICE_PATTERNS) {
    if (service.keywords.length === 0) {
      continue;
    }

    if (service.keywords.some((keyword) => normalized.includes(keyword))) {
      return service.label;
    }
  }

  return "Intervento generico";
}

function findAddress(text: string) {
  const match = text.match(
    /((?:via|viale|piazza|corso|largo|vicolo)\s+[A-Za-zÀ-ÿ' ]+\s+\d+[A-Za-z0-9/-]*?(?:,\s*[A-Za-zÀ-ÿ' ]+)*)/i
  );

  if (!match) {
    return undefined;
  }

  const cleaned = match[1].replace(
    /,\s*(puoi|potete|serve|domani|oggi|luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica).*/i,
    ""
  );

  return normalizeWhitespace(cleaned);
}

function findPreferredWindow(text: string) {
  const normalized = text.toLowerCase();
  const windowPatterns = [
    /(oggi|domani)(?:\s+(mattina|pomeriggio|sera))?/i,
    /(lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)(?:\s+(mattina|pomeriggio|sera))?/i,
    /(dopo le\s+\d{1,2}(?::\d{2})?)/i,
    /(prima delle\s+\d{1,2}(?::\d{2})?)/i
  ];

  for (const pattern of windowPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return normalizeWhitespace(match[0]);
    }
  }

  return undefined;
}

function findMeasurements(text: string) {
  const match = text.match(/\b\d{2,4}\s?[xX]\s?\d{2,4}\s?(?:cm|mm|m)?\b/);
  return match ? normalizeWhitespace(match[0]) : undefined;
}

function findCustomerName(text: string) {
  const match = text.match(/(?:sono|mi chiamo)\s+([A-ZÀ-Ý][A-Za-zÀ-ÿ']+(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ']+){0,2})/);
  return match ? titleCase(match[1]) : undefined;
}

function findMaterials(text: string) {
  const normalized = text.toLowerCase();
  return MATERIAL_KEYWORDS.filter((keyword) => normalized.includes(keyword)).map((keyword) =>
    titleCase(keyword)
  );
}

function findUrgency(text: string): IntakeUrgency {
  const normalized = text.toLowerCase();

  if (HIGH_URGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "high";
  }

  if (LOW_URGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "low";
  }

  return "medium";
}

function inferVisitNeeded(input: {
  text: string;
  serviceType: string;
  photoCount?: number;
  measurements?: string;
}) {
  const normalized = input.text.toLowerCase();
  const serviceType = input.serviceType.toLowerCase();

  if (normalized.length < 32) {
    return true;
  }

  if (serviceType.includes("imbiancatura") || serviceType.includes("montaggio")) {
    return true;
  }

  if (serviceType.includes("intervento generico")) {
    return true;
  }

  if (!input.photoCount && /(tapparella|porta|finestra|perdita|rubinetto|serratura)/.test(normalized)) {
    return true;
  }

  if (input.photoCount && /(tapparella|porta|finestra|rubinetto)/.test(normalized) && !input.measurements) {
    return false;
  }

  return true;
}

function inferMissingFields(input: { text: string; address?: string; serviceType: string }) {
  const missingFields: string[] = [];

  if (!input.address) {
    missingFields.push("address");
  }

  if (input.text.trim().length < 24 || input.serviceType === "Intervento generico") {
    missingFields.push("scope");
  }

  return missingFields;
}

function inferNextAction(input: { visitNeeded: boolean; missingFields: string[] }): IntakeNextAction {
  if (input.missingFields.length > 0) {
    return "ask_clarification";
  }

  return input.visitNeeded ? "schedule_visit" : "book_intervention";
}

function inferConfidence(input: {
  serviceType: string;
  address?: string;
  text: string;
  visitNeeded: boolean;
}) {
  if (input.serviceType === "Intervento generico" || input.text.trim().length < 24) {
    return "low" as const;
  }

  if (!input.address || input.visitNeeded) {
    return "medium" as const;
  }

  return "high" as const;
}

function buildSummary(input: {
  serviceType: string;
  address?: string;
  urgency: IntakeUrgency;
  preferredWindow?: string;
  materialsMentioned: string[];
  visitNeeded: boolean;
}) {
  const parts = [input.serviceType];

  if (input.address) {
    parts.push(`in ${input.address}`);
  }

  const timing = input.preferredWindow ? `preferenza ${input.preferredWindow}` : undefined;
  const materials = input.materialsMentioned.length
    ? `materiali citati: ${input.materialsMentioned.join(", ")}`
    : undefined;
  const urgency = input.urgency === "high" ? "urgenza alta" : input.urgency === "low" ? "urgenza bassa" : "urgenza media";
  const visit = input.visitNeeded ? "serve sopralluogo" : "intervento diretto possibile";

  return [parts.join(" "), urgency, timing, materials, visit].filter(Boolean).join(" • ");
}

export function parseWorkIntakeHeuristically(input: {
  text: string;
  customerName?: string;
  phone?: string;
  photoCount?: number;
}) {
  const text = normalizeWhitespace(input.text);
  const serviceType = findServiceType(text);
  const address = findAddress(text);
  const preferredWindow = findPreferredWindow(text);
  const materialsMentioned = findMaterials(text);
  const measurements = findMeasurements(text);
  const urgency = findUrgency(text);
  const visitNeeded = inferVisitNeeded({
    text,
    serviceType,
    photoCount: input.photoCount,
    measurements
  });
  const missingFields = inferMissingFields({ text, address, serviceType });
  const nextAction = inferNextAction({ visitNeeded, missingFields });
  const confidence = inferConfidence({ serviceType, address, text, visitNeeded });

  return {
    customerName: input.customerName?.trim() || findCustomerName(text),
    serviceType,
    address,
    urgency,
    preferredWindow,
    materialsMentioned,
    measurements,
    visitNeeded,
    nextAction,
    summary: buildSummary({
      serviceType,
      address,
      urgency,
      preferredWindow,
      materialsMentioned,
      visitNeeded
    }),
    missingFields,
    confidence,
    source: "heuristic"
  } satisfies StructuredWorkIntakeSuggestion;
}

function normalizeSuggestion(
  parsed: Partial<StructuredWorkIntakeSuggestion>,
  fallback: StructuredWorkIntakeSuggestion
) {
  const serviceType = parsed.serviceType?.trim() || fallback.serviceType;
  const address = parsed.address?.trim() || fallback.address;
  const urgency = parsed.urgency ?? fallback.urgency;
  const preferredWindow = parsed.preferredWindow?.trim() || fallback.preferredWindow;
  const materialsMentioned = Array.isArray(parsed.materialsMentioned)
    ? parsed.materialsMentioned.filter(Boolean).slice(0, 8)
    : fallback.materialsMentioned;
  const measurements = parsed.measurements?.trim() || fallback.measurements;
  const visitNeeded = typeof parsed.visitNeeded === "boolean" ? parsed.visitNeeded : fallback.visitNeeded;
  const missingFields = Array.isArray(parsed.missingFields)
    ? parsed.missingFields.filter(Boolean).slice(0, 4)
    : fallback.missingFields;
  const nextAction = parsed.nextAction ?? fallback.nextAction;
  const confidence = parsed.confidence ?? fallback.confidence;

  return {
    customerName: parsed.customerName?.trim() || fallback.customerName,
    serviceType,
    address,
    urgency,
    preferredWindow,
    materialsMentioned,
    measurements,
    visitNeeded,
    nextAction,
    summary:
      parsed.summary?.trim() ||
      buildSummary({
        serviceType,
        address,
        urgency,
        preferredWindow,
        materialsMentioned,
        visitNeeded
      }),
    missingFields,
    confidence,
    source: "openai"
  } satisfies StructuredWorkIntakeSuggestion;
}

async function parseWithOpenAI(input: {
  text: string;
  customerName?: string;
  phone?: string;
  photoCount?: number;
  fallback: StructuredWorkIntakeSuggestion;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract a small-business handyman intake from raw WhatsApp or voice transcript text. Return JSON only with keys customerName, serviceType, address, urgency, preferredWindow, materialsMentioned, measurements, visitNeeded, nextAction, summary, missingFields, confidence. Use urgency values low|medium|high, nextAction values ask_clarification|schedule_visit|book_intervention, confidence values low|medium|high."
        },
        {
          role: "user",
          content: JSON.stringify({
            customerName: input.customerName,
            phone: input.phone,
            photoCount: input.photoCount ?? 0,
            text: input.text
          })
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content) as Partial<StructuredWorkIntakeSuggestion>;
  return normalizeSuggestion(parsed, input.fallback);
}

export async function analyzeWorkIntake(input: {
  text: string;
  customerName?: string;
  phone?: string;
  photoCount?: number;
}) {
  const fallback = parseWorkIntakeHeuristically(input);

  try {
    const aiSuggestion = await parseWithOpenAI({
      ...input,
      fallback
    });

    return aiSuggestion ?? fallback;
  } catch {
    return fallback;
  }
}
