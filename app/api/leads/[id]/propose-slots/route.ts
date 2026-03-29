import { jsonCreated } from "@/lib/api";
import { createProposalForLead } from "@/lib/whatsapp-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const created = await createProposalForLead({ leadId: id });

  return jsonCreated({
    message: "Proposta sopralluogo generata e messa in approvazione handyman.",
    item: created
  });
}
