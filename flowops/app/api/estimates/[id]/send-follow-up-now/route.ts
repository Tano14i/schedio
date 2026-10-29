import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { sendEstimateFollowUpNow } from "@/lib/estimates-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const result = await sendEstimateFollowUpNow(session.companyId, id);
  if (!result.sent) {
    return Response.json(
      { message: result.errorMessage ?? "Follow-up non inviato." },
      { status: 422 }
    );
  }
  return jsonUpdated({
    message: "Follow-up inviato ora."
  });
}
