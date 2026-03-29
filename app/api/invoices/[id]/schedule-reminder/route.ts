import { jsonUpdated } from "@/lib/api";
import { scheduleInvoiceReminder } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await scheduleInvoiceReminder(id);
  return jsonUpdated({
    message: item ? "Reminder fattura programmato." : "Nessun reminder da programmare.",
    item
  });
}
