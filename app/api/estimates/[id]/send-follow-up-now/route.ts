import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { sendEstimateFollowUpNow } from "@/lib/estimates-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  await sendEstimateFollowUpNow(id);
  return jsonUpdated({
    message: "Follow-up inviato ora."
  });
}
