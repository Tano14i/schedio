import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createInvoiceDraftFromJob, getInvoicePageData } from "@/lib/invoices-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { invoices } = await getInvoicePageData();
  return jsonOk({ items: invoices });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = (await request.json().catch(() => ({}))) as { jobId?: string };

  if (!body.jobId) {
    return jsonCreated({
      message: "Serve un lavoro completato per creare la bozza fattura.",
      item: null
    });
  }

  const item = await createInvoiceDraftFromJob(body.jobId);
  return jsonCreated({
    message: "Bozza fattura creata.",
    item
  });
}
