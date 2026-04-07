import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { sendVisitProposalToCustomer } from "@/lib/whatsapp-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const proposal = await sendVisitProposalToCustomer(id);

  return jsonUpdated({
    message: "Proposta inviata al cliente su WhatsApp.",
    item: proposal
  });
}
