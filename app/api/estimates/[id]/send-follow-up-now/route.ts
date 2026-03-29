import { jsonUpdated } from "@/lib/api";
import { sendEstimateFollowUpNow } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await sendEstimateFollowUpNow(id);
  return jsonUpdated({
    message: "Follow-up inviato ora."
  });
}
