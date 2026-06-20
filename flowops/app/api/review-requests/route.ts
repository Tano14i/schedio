import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getInvoicePageData } from "@/lib/invoices-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { reviewRequests } = await getInvoicePageData();
  return jsonOk({ items: reviewRequests });
}
