import { jsonUpdated } from "@/lib/api";
import { markInvoiceViewed } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const item = await markInvoiceViewed(token);
  return jsonUpdated({
    message: "Fattura visualizzata.",
    item
  });
}
