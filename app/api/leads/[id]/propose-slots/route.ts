import { jsonCreated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createProposalForLead } from "@/lib/whatsapp-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const created = await createProposalForLead({ leadId: id });

  return jsonCreated({
    message: "Proposta sopralluogo generata e messa in approvazione handyman.",
    item: created
  });
}
