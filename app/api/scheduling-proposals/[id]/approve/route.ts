import { jsonUpdated } from "@/lib/api";
import { approveSchedulingProposal } from "@/lib/whatsapp-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { selectedSlotId?: string };
  const proposal = await approveSchedulingProposal({
    proposalId: id,
    selectedSlotId: body.selectedSlotId
  });

  return jsonUpdated({
    message: "Proposta approvata dall'handyman.",
    item: proposal
  });
}
