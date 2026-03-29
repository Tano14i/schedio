import { jsonUpdated } from "@/lib/api";
import { markInvoicePaid } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await markInvoicePaid(id);
  return jsonUpdated({
    message: "Pagamento registrato.",
    item
  });
}
