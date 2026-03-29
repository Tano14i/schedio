import { jsonUpdated } from "@/lib/api";
import { sendDueEstimateFollowUps } from "@/lib/estimates-server";

export async function POST() {
  const sent = await sendDueEstimateFollowUps();
  return jsonUpdated({
    message: "Runner follow-up completato.",
    sent
  });
}
