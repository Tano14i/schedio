import { jsonUpdated } from "@/lib/api";
import { sendDueInvoiceReminders } from "@/lib/invoices-server";

export async function POST() {
  const sent = await sendDueInvoiceReminders();
  return jsonUpdated({
    message: "Reminder fatture elaborati.",
    sent
  });
}
