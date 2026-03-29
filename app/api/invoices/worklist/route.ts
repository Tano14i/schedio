import { jsonOk } from "@/lib/api";
import { getInvoiceWorklist } from "@/lib/invoices-server";

export async function GET() {
  const items = await getInvoiceWorklist();
  return jsonOk({ items });
}
