import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createInvoiceDraftFromJob, getInvoicePageData } from "@/lib/invoices-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const { invoices, pagination } = await getInvoicePageData({ page, limit });
  return jsonOk({ data: invoices, pagination });
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
