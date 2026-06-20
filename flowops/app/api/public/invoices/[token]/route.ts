import { jsonOk } from "@/lib/api";
import { getPublicInvoiceData } from "@/lib/invoices-server";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const item = await getPublicInvoiceData(token);
  return jsonOk({ item });
}
