type FollowUpAiSource = "heuristic" | "openai";
type EstimateFollowUpScenario = "not_viewed" | "viewed_not_accepted";
type InvoiceReminderScenario = "before_due" | "overdue";

export type EstimateFollowUpAiAssist = {
  source: FollowUpAiSource;
  scenario: EstimateFollowUpScenario;
  summary: string;
  message: string;
  recommendation: "follow_up_now" | "call_customer";
};

export type InvoiceReminderAiAssist = {
  source: FollowUpAiSource;
  scenario: InvoiceReminderScenario;
  summary: string;
  message: string;
  recommendation: "send_reminder" | "call_customer";
};

export type ReviewRequestAiAssist = {
  source: FollowUpAiSource;
  summary: string;
  message: string;
};

function getFirstName(fullName?: string | null) {
  const value = fullName?.trim();
  if (!value) {
    return "cliente";
  }

  return value.split(/\s+/)[0] ?? value;
}

function normalizeMoney(value: number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function formatMoney(value: number | null | undefined) {
  const amount = normalizeMoney(value);
  const hasDecimals = Math.round(amount) !== amount;
  const formatted = new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(amount);

  return `${formatted} euro`;
}

function normalizeEstimateFollowUpAssist(
  parsed: Partial<EstimateFollowUpAiAssist>,
  fallback: EstimateFollowUpAiAssist
): EstimateFollowUpAiAssist {
  return {
    source: "openai",
    scenario:
      parsed.scenario === "not_viewed" || parsed.scenario === "viewed_not_accepted"
        ? parsed.scenario
        : fallback.scenario,
    summary: parsed.summary?.trim() || fallback.summary,
    message: parsed.message?.trim() || fallback.message,
    recommendation:
      parsed.recommendation === "call_customer" || parsed.recommendation === "follow_up_now"
        ? parsed.recommendation
        : fallback.recommendation
  };
}

function normalizeInvoiceReminderAiAssist(
  parsed: Partial<InvoiceReminderAiAssist>,
  fallback: InvoiceReminderAiAssist
): InvoiceReminderAiAssist {
  return {
    source: "openai",
    scenario:
      parsed.scenario === "before_due" || parsed.scenario === "overdue"
        ? parsed.scenario
        : fallback.scenario,
    summary: parsed.summary?.trim() || fallback.summary,
    message: parsed.message?.trim() || fallback.message,
    recommendation:
      parsed.recommendation === "call_customer" || parsed.recommendation === "send_reminder"
        ? parsed.recommendation
        : fallback.recommendation
  };
}

function normalizeReviewRequestAiAssist(
  parsed: Partial<ReviewRequestAiAssist>,
  fallback: ReviewRequestAiAssist
): ReviewRequestAiAssist {
  return {
    source: "openai",
    summary: parsed.summary?.trim() || fallback.summary,
    message: parsed.message?.trim() || fallback.message
  };
}

async function refineWithOpenAI<T>(input: {
  type: "estimate_followup" | "invoice_reminder" | "review_request";
  systemPrompt: string;
  payload: Record<string, unknown>;
  fallback: T;
  normalize: (parsed: Partial<T>, fallback: T) => T;
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
          content: input.systemPrompt
        },
        {
          role: "user",
          content: JSON.stringify({
            type: input.type,
            payload: input.payload,
            fallback: input.fallback
          })
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  return input.normalize(JSON.parse(content) as Partial<T>, input.fallback);
}

export async function buildEstimateFollowUpAiAssist(input: {
  customerName?: string | null;
  title?: string | null;
  total?: number | null;
  publicUrl: string;
  viewedAt?: string | Date | null;
  reason?: string | null;
}) {
  const firstName = getFirstName(input.customerName);
  const scenario: EstimateFollowUpScenario =
    input.reason === "viewed_not_accepted" || input.viewedAt ? "viewed_not_accepted" : "not_viewed";
  const title = input.title?.trim() || "il preventivo";
  const amount = input.total ? formatMoney(input.total) : null;

  const fallback: EstimateFollowUpAiAssist =
    scenario === "viewed_not_accepted"
      ? {
          source: "heuristic",
          scenario,
          summary: "Il cliente ha gia aperto il preventivo: conviene sbloccare dubbi o tempi, non solo ricordare il link.",
          message: `Ciao ${firstName}, ho visto che hai gia aperto ${title}${amount ? ` da ${amount}` : ""}. Se vuoi possiamo sentirci 5 minuti e chiarire subito gli ultimi dubbi. Intanto ti lascio qui il link: ${input.publicUrl}`,
          recommendation: "call_customer"
        }
      : {
          source: "heuristic",
          scenario,
          summary: "Il cliente non ha ancora visto il preventivo: meglio un messaggio corto e semplice che rimetta il link davanti agli occhi.",
          message: `Ciao ${firstName}, ti giro di nuovo ${title}${amount ? ` da ${amount}` : ""}. Appena riesci dagli un'occhiata e se vuoi ci sentiamo per fissare il prossimo passo: ${input.publicUrl}`,
          recommendation: "follow_up_now"
        };

  try {
    const refined = await refineWithOpenAI({
      type: "estimate_followup",
      systemPrompt:
        "You write short Italian WhatsApp follow-up messages for handyman estimates. Return JSON only with summary, message, recommendation, scenario. Keep the tone human, practical, and non-pushy.",
      payload: {
        customerName: input.customerName,
        title,
        total: input.total,
        publicUrl: input.publicUrl,
        scenario
      },
      fallback,
      normalize: normalizeEstimateFollowUpAssist
    });

    return refined ?? fallback;
  } catch {
    return fallback;
  }
}

export async function buildInvoiceReminderAiAssist(input: {
  customerName?: string | null;
  invoiceNumber: string;
  total: number;
  dueDate?: string | Date | null;
  publicUrl?: string | null;
  reason?: string | null;
}) {
  const firstName = getFirstName(input.customerName);
  const scenario: InvoiceReminderScenario = input.reason === "before_due" ? "before_due" : "overdue";
  const amount = formatMoney(input.total);
  const linkSuffix = input.publicUrl ? ` La trovi qui: ${input.publicUrl}` : "";

  const fallback: InvoiceReminderAiAssist =
    scenario === "before_due"
      ? {
          source: "heuristic",
          scenario,
          summary: "Promemoria morbido prima della scadenza: serve solo rimettere in vista la fattura senza creare attrito.",
          message: `Ciao ${firstName}, ti ricordo la fattura ${input.invoiceNumber} da ${amount}. Se hai bisogno di chiarimenti o vuoi un riepilogo, scrivimi pure.${linkSuffix}`,
          recommendation: "send_reminder"
        }
      : {
          source: "heuristic",
          scenario,
          summary: "La fattura e scaduta: meglio un tono cortese ma diretto, con importo e supporto immediato.",
          message: `Ciao ${firstName}, ti ricordo la fattura ${input.invoiceNumber} da ${amount}, che risulta ancora aperta. Se hai bisogno di chiarimenti o vuoi confermarmi il pagamento, ci sono.${linkSuffix}`,
          recommendation: "send_reminder"
        };

  try {
    const refined = await refineWithOpenAI({
      type: "invoice_reminder",
      systemPrompt:
        "You write short Italian WhatsApp invoice reminder messages for small field-service businesses. Return JSON only with summary, message, recommendation, scenario. Be polite, concise, and useful.",
      payload: {
        customerName: input.customerName,
        invoiceNumber: input.invoiceNumber,
        total: input.total,
        dueDate: input.dueDate,
        publicUrl: input.publicUrl,
        scenario
      },
      fallback,
      normalize: normalizeInvoiceReminderAiAssist
    });

    return refined ?? fallback;
  } catch {
    return fallback;
  }
}

export async function buildReviewRequestAiAssist(input: {
  customerName?: string | null;
  reviewLink?: string | null;
  workSummary?: string | null;
}) {
  const firstName = getFirstName(input.customerName);
  const link = input.reviewLink?.trim() || "https://g.page/r/demo-review-link";
  const workLabel = input.workSummary?.trim() || "il lavoro fatto";

  const fallback: ReviewRequestAiAssist = {
    source: "heuristic",
    summary: "La review request deve sembrare una richiesta umana fatta a lavoro chiuso, non un messaggio automatico freddo.",
    message: `Ciao ${firstName}, grazie ancora per la fiducia su ${workLabel}. Se ti va, ci lasci una recensione? Ci aiuta molto: ${link}`
  };

  try {
    const refined = await refineWithOpenAI({
      type: "review_request",
      systemPrompt:
        "You write short Italian WhatsApp review request messages after a handyman job is paid. Return JSON only with summary and message. Keep it warm, simple, and non-pushy.",
      payload: {
        customerName: input.customerName,
        reviewLink: link,
        workSummary: workLabel
      },
      fallback,
      normalize: normalizeReviewRequestAiAssist
    });

    return refined ?? fallback;
  } catch {
    return fallback;
  }
}
