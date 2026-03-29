import { jsonUpdated } from "@/lib/api";
import { sendInvoiceToCustomer } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await sendInvoiceToCustomer(id);
  return jsonUpdated({
    message: "Fattura inviata al cliente.",
    item
  });
}
