import { jsonUpdated } from "@/lib/api";
import { describeDelivery } from "@/lib/message-format";
import { requireSession } from "@/lib/auth";
import { sendVisitProposalToCustomer } from "@/lib/whatsapp-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const { proposal, delivery } = await sendVisitProposalToCustomer(session.companyId, id);

  return jsonUpdated({
    message: describeDelivery(delivery, "Proposta di sopralluogo", true),
    item: proposal,
    delivery
  });
}
