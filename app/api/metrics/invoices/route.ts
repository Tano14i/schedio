import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getInvoiceMetrics } from "@/lib/invoices-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const item = await getInvoiceMetrics();
  return jsonOk({ item });
}
