import { jsonCreated } from "@/lib/api";
import { createInvoiceDraftFromEstimate } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await createInvoiceDraftFromEstimate(id);
  return jsonCreated({
    message: "Bozza fattura creata dal preventivo accettato.",
    item
  });
}
