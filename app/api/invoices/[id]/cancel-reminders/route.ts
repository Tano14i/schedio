import { jsonUpdated } from "@/lib/api";
import { cancelInvoiceReminders } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await cancelInvoiceReminders(id);
  return jsonUpdated({
    message: "Reminder fattura annullati."
  });
}
