import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getInvoiceWorklist } from "@/lib/invoices-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const items = await getInvoiceWorklist();
  return jsonOk({ items });
}
