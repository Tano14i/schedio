import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { markInvoicePaid } from "@/lib/invoices-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await markInvoicePaid(id);
  return jsonUpdated({
    message: "Pagamento registrato.",
    item
  });
}
