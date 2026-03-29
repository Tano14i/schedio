import { jsonUpdated } from "@/lib/api";
import { sendVisitProposalToCustomer } from "@/lib/whatsapp-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const proposal = await sendVisitProposalToCustomer(id);

  return jsonUpdated({
    message: "Proposta inviata al cliente su WhatsApp.",
    item: proposal
  });
}
