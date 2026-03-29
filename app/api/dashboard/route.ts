import { jsonOk } from "@/lib/api";
import { computeFunnelMetrics } from "@/lib/estimates-server";
import { getInvoiceMetrics } from "@/lib/invoices-server";

export async function GET() {
  const [funnel, invoices] = await Promise.all([
    computeFunnelMetrics(),
    getInvoiceMetrics()
  ]);

  return jsonOk({
    stats: [
      { id: "leads", label: "Lead ricevuti", value: String(funnel.leadsReceived), detail: "Ingresso funnel" },
      { id: "visits", label: "Sopralluoghi confermati", value: String(funnel.visitsConfirmed), detail: "Agenda confermata" },
      { id: "quotes", label: "Preventivi inviati", value: String(funnel.estimatesSent), detail: "Preventivi aperti" },
      { id: "cash", label: "Incassato mese", value: String(invoices.cashCollectedMonth), detail: "Cassa registrata" }
    ]
  });
}
