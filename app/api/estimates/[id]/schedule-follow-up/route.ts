import { jsonUpdated } from "@/lib/api";
import { scheduleEstimateFollowUp } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await scheduleEstimateFollowUp(id);
  return jsonUpdated({
    message: "Follow-up programmato.",
    item
  });
}
