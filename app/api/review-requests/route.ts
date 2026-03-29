import { jsonOk } from "@/lib/api";
import { getInvoicePageData } from "@/lib/invoices-server";

export async function GET() {
  const { reviewRequests } = await getInvoicePageData();
  return jsonOk({ items: reviewRequests });
}
