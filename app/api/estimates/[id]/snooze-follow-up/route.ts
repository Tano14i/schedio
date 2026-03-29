import { jsonUpdated } from "@/lib/api";
import { snoozeEstimateFollowUp } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await snoozeEstimateFollowUp(id);
  return jsonUpdated({
    message: "Follow-up posticipato.",
    item
  });
}
