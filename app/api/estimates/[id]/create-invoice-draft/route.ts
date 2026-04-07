import { jsonCreated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createInvoiceDraftFromEstimate } from "@/lib/invoices-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await createInvoiceDraftFromEstimate(id);
  return jsonCreated({
    message: "Bozza fattura creata dal preventivo accettato.",
    item
  });
}
