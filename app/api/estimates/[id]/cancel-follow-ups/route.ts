import { jsonUpdated } from "@/lib/api";
import { cancelEstimateFollowUps } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await cancelEstimateFollowUps(id);
  return jsonUpdated({
    message: "Follow-up annullati."
  });
}
