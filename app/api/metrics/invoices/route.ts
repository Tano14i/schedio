import { jsonOk } from "@/lib/api";
import { getInvoiceMetrics } from "@/lib/invoices-server";

export async function GET() {
  const item = await getInvoiceMetrics();
  return jsonOk({ item });
}
