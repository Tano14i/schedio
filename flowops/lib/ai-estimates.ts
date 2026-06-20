type EstimateAssistSource = "heuristic" | "openai";
type EstimateAlertSeverity = "high" | "medium" | "low";

export type EstimateAssistItem = {
  label: string;
  description?: string;
  qty: number;
  unitPrice: number;
};

export type EstimateMarginAlert = {
  severity: EstimateAlertSeverity;
  title: string;
  body: string;
};

export type EstimateAiAssist = {
  source: EstimateAssistSource;
  summary: string;
  targetMarginRate: number;
  currentTotal: number;
  trackedCost: number;
  currentMargin: number | null;
  currentMarginRate: number | null;
  recommendedMinimumTotal: number | null;
  suggestedTotal: number;
  projectedMargin: number | null;
  projectedMarginRate: number | null;
  laborCost: number;
  materialCost: number;
  otherCost: number;
  suggestedItems: EstimateAssistItem[];
  alerts: EstimateMarginAlert[];
};

type EstimateAssistInput = {
  title?: string | null;
  scopeSummary?: string | null;
  notes?: string | null;
  serviceType?: string | null;
  items: EstimateAssistItem[];
  laborCost: number;
  materialCost: number;
  otherCost: number;
};

const MATERIAL_WORDS = [
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
  "guarnizione",
  "kit viti"
] as const;

function normalizeMoney(value: number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function roundPrice(value: number) {
  return Math.max(0, Number(value.toFixed(2)));
}

function sumItems(items: EstimateAssistItem[]) {
  return roundPrice(items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0));
}

function extractMaterials(text: string) {
  const normalized = text.toLowerCase();
  return MATERIAL_WORDS.filter((word) => normalized.includes(word)).map((word) =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
}

function buildDefaultItems(input: EstimateAssistInput, recommendedTotal: number) {
  const baseLabel = input.serviceType?.trim() || input.title?.trim() || "Intervento";
  const text = [input.scopeSummary, input.notes].filter(Boolean).join(" ");
  const materialsMentioned = extractMaterials(text);

  const items: EstimateAssistItem[] = [];
  const laborSell = input.laborCost > 0 ? roundPrice(input.laborCost * 1.55) : 0;
  const materialSell = input.materialCost > 0 ? roundPrice(input.materialCost * 1.3) : 0;
  const otherSell = input.otherCost > 0 ? roundPrice(input.otherCost * 1.2) : 0;

  if (laborSell > 0) {
    items.push({
      label: "Manodopera intervento",
      description: baseLabel,
      qty: 1,
      unitPrice: laborSell
    });
  }

  if (materialSell > 0 || materialsMentioned.length) {
    items.push({
      label: "Materiali e ferramenta",
      description: materialsMentioned.length ? materialsMentioned.join(", ") : "Materiali da confermare",
      qty: 1,
      unitPrice: materialSell || roundPrice(recommendedTotal * 0.2)
    });
  }

  if (otherSell > 0) {
    items.push({
      label: "Uscita e trasferta",
      description: "Copertura costi accessori",
      qty: 1,
      unitPrice: otherSell
    });
  }

  const current = sumItems(items);
  if (recommendedTotal > current) {
    items.unshift({
      label: baseLabel,
      description: input.scopeSummary ?? "Intervento da confermare",
      qty: 1,
      unitPrice: roundPrice(recommendedTotal - current)
    });
  }

  if (!items.length) {
    items.push({
      label: baseLabel,
      description: input.scopeSummary ?? "Intervento da confermare",
      qty: 1,
      unitPrice: recommendedTotal
    });
  }

  return items;
}

function scaleItems(items: EstimateAssistItem[], targetTotal: number) {
  const currentTotal = sumItems(items);

  if (currentTotal <= 0) {
    return items;
  }

  const scale = targetTotal / currentTotal;

  return items.map((item, index) => {
    const scaledPrice = roundPrice(item.unitPrice * scale);

    if (index === items.length - 1) {
      const subtotalBeforeLast = items
        .slice(0, -1)
        .reduce((sum, current, currentIndex) => sum + current.qty * roundPrice(current.unitPrice * scale), 0);
      const remaining = roundPrice((targetTotal - subtotalBeforeLast) / Math.max(item.qty, 1));

      return {
        ...item,
        unitPrice: remaining
      };
    }

    return {
      ...item,
      unitPrice: scaledPrice
    };
  });
}

function buildAlerts(input: {
  currentTotal: number;
  trackedCost: number;
  currentMargin: number | null;
  currentMarginRate: number | null;
  recommendedMinimumTotal: number | null;
  unpricedItems: number;
  laborCost: number;
}) {
  const alerts: EstimateMarginAlert[] = [];

  if (input.unpricedItems > 0) {
    alerts.push({
      severity: "medium",
      title: "Ci sono voci senza prezzo",
      body: "Una o più voci del preventivo hanno ancora prezzo zero. Prima di inviare conviene chiudere i buchi."
    });
  }

  if (input.trackedCost <= 0) {
    alerts.push({
      severity: "medium",
      title: "Mancano costi registrati",
      body: "Senza ore o costi materiali il margine resta solo indicativo. Registra almeno manodopera o materiali."
    });

    return alerts;
  }

  if ((input.currentMargin ?? 0) < 0) {
    alerts.push({
      severity: "high",
      title: "Questo preventivo oggi va in perdita",
      body: "Con i costi registrati adesso il ricavo non copre manodopera e materiali."
    });
  } else if ((input.currentMarginRate ?? 0) < 20) {
    alerts.push({
      severity: "high",
      title: "Margine troppo basso",
      body: "Il lavoro sembra vendibile, ma il margine stimato e troppo stretto per stare tranquillo."
    });
  } else if ((input.currentMarginRate ?? 0) < 30) {
    alerts.push({
      severity: "medium",
      title: "Margine sotto la soglia consigliata",
      body: "Puoi farlo, ma rischi di guadagnare meno del previsto se il lavoro si allunga."
    });
  }

  if (input.currentTotal > 0 && input.laborCost / input.currentTotal > 0.6) {
    alerts.push({
      severity: "medium",
      title: "La manodopera pesa troppo sul totale",
      body: "Le ore registrate stanno mangiando gran parte del preventivo. Rivedi prezzo o durata stimata."
    });
  }

  if (input.recommendedMinimumTotal && input.currentTotal < input.recommendedMinimumTotal) {
    alerts.push({
      severity: "low",
      title: "Prezzo minimo consigliato piu alto",
      body: "Per stare sopra il margine target conviene alzare il totale prima di confermare il lavoro."
    });
  }

  return alerts;
}

function buildSummary(input: {
  currentMarginRate: number | null;
  recommendedMinimumTotal: number | null;
  currentTotal: number;
  projectedMarginRate: number | null;
}) {
  if (!input.recommendedMinimumTotal) {
    return "Manca ancora qualche costo registrato. Posso suggerire una bozza, ma il margine resta indicativo.";
  }

  const currentMargin = input.currentMarginRate === null ? "n/d" : `${input.currentMarginRate}%`;
  const projectedMargin = input.projectedMarginRate === null ? "n/d" : `${input.projectedMarginRate}%`;

  return `Oggi il preventivo lascia ${currentMargin} di margine stimato. Per stare sopra la soglia consigliata conviene arrivare almeno a ${input.recommendedMinimumTotal.toFixed(0)} euro. La bozza proposta porta il margine stimato a ${projectedMargin}.`;
}

function normalizeSuggestedAssist(
  parsed: Partial<EstimateAiAssist>,
  fallback: EstimateAiAssist
): EstimateAiAssist {
  return {
    source: "openai",
    summary: parsed.summary?.trim() || fallback.summary,
    targetMarginRate: typeof parsed.targetMarginRate === "number" ? parsed.targetMarginRate : fallback.targetMarginRate,
    currentTotal: fallback.currentTotal,
    trackedCost: fallback.trackedCost,
    currentMargin: fallback.currentMargin,
    currentMarginRate: fallback.currentMarginRate,
    recommendedMinimumTotal: fallback.recommendedMinimumTotal,
    suggestedTotal: typeof parsed.suggestedTotal === "number" ? roundPrice(parsed.suggestedTotal) : fallback.suggestedTotal,
    projectedMargin:
      typeof parsed.projectedMargin === "number" ? roundPrice(parsed.projectedMargin) : fallback.projectedMargin,
    projectedMarginRate:
      typeof parsed.projectedMarginRate === "number" ? Number(parsed.projectedMarginRate.toFixed(1)) : fallback.projectedMarginRate,
    laborCost: fallback.laborCost,
    materialCost: fallback.materialCost,
    otherCost: fallback.otherCost,
    suggestedItems:
      Array.isArray(parsed.suggestedItems) && parsed.suggestedItems.length
        ? parsed.suggestedItems.map((item) => ({
            label: item.label?.trim() || "Voce preventivo",
            description: item.description?.trim() || undefined,
            qty: Number(item.qty ?? 1),
            unitPrice: roundPrice(Number(item.unitPrice ?? 0))
          }))
        : fallback.suggestedItems,
    alerts:
      Array.isArray(parsed.alerts) && parsed.alerts.length
        ? parsed.alerts
            .filter((alert) => alert?.title && alert?.body)
            .map((alert) => ({
              severity: (alert.severity ?? "medium") as EstimateAlertSeverity,
              title: String(alert.title),
              body: String(alert.body)
            }))
        : fallback.alerts
  };
}

async function refineEstimateWithOpenAI(input: {
  context: EstimateAssistInput;
  fallback: EstimateAiAssist;
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
            "You assist a handyman estimate workflow. Return JSON only with keys summary, suggestedItems, suggestedTotal, projectedMargin, projectedMarginRate, alerts. Keep pricing conservative and explain if margin is too low."
        },
        {
          role: "user",
          content: JSON.stringify({
            title: input.context.title,
            serviceType: input.context.serviceType,
            scopeSummary: input.context.scopeSummary,
            notes: input.context.notes,
            existingItems: input.context.items,
            laborCost: input.context.laborCost,
            materialCost: input.context.materialCost,
            otherCost: input.context.otherCost,
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

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content) as Partial<EstimateAiAssist>;
  return normalizeSuggestedAssist(parsed, input.fallback);
}

export async function buildEstimateAiAssist(input: EstimateAssistInput) {
  const currentTotal = sumItems(input.items);
  const laborCost = normalizeMoney(input.laborCost);
  const materialCost = normalizeMoney(input.materialCost);
  const otherCost = normalizeMoney(input.otherCost);
  const trackedCost = normalizeMoney(laborCost + materialCost + otherCost);
  const currentMargin = trackedCost > 0 ? roundPrice(currentTotal - trackedCost) : null;
  const currentMarginRate =
    trackedCost > 0 && currentTotal > 0 ? Number((((currentTotal - trackedCost) / currentTotal) * 100).toFixed(1)) : null;
  const targetMarginRate = 35;
  const recommendedMinimumTotal =
    trackedCost > 0 ? roundPrice(trackedCost / (1 - targetMarginRate / 100)) : null;
  const suggestedTotal = recommendedMinimumTotal ? Math.max(currentTotal, recommendedMinimumTotal) : currentTotal;
  const suggestedItems =
    currentTotal > 0
      ? scaleItems(input.items, suggestedTotal)
      : buildDefaultItems(input, suggestedTotal || roundPrice(trackedCost * 1.4 || 180));
  const projectedTotal = sumItems(suggestedItems);
  const projectedMargin = trackedCost > 0 ? roundPrice(projectedTotal - trackedCost) : null;
  const projectedMarginRate =
    trackedCost > 0 && projectedTotal > 0 ? Number((((projectedTotal - trackedCost) / projectedTotal) * 100).toFixed(1)) : null;
  const alerts = buildAlerts({
    currentTotal,
    trackedCost,
    currentMargin,
    currentMarginRate,
    recommendedMinimumTotal,
    unpricedItems: input.items.filter((item) => item.unitPrice <= 0).length,
    laborCost
  });

  const fallback = {
    source: "heuristic" as const,
    summary: buildSummary({
      currentMarginRate,
      recommendedMinimumTotal,
      currentTotal,
      projectedMarginRate
    }),
    targetMarginRate,
    currentTotal,
    trackedCost,
    currentMargin,
    currentMarginRate,
    recommendedMinimumTotal,
    suggestedTotal: projectedTotal,
    projectedMargin,
    projectedMarginRate,
    laborCost,
    materialCost,
    otherCost,
    suggestedItems,
    alerts
  };

  try {
    const refined = await refineEstimateWithOpenAI({
      context: input,
      fallback
    });

    return refined ?? fallback;
  } catch {
    return fallback;
  }
}
