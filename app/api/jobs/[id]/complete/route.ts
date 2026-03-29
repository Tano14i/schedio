import { jsonUpdated } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";
import { completeJobAndCaptureSummary } from "@/lib/estimates-server";
import { getJobByIdForUser } from "@/lib/jobs-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getSessionFromRequest(request);
  const job = await getJobByIdForUser(
    id,
    session
      ? {
          id: session.userId,
          companyId: session.companyId,
          role: session.role
        }
      : undefined
  );

  if (!job) {
    return Response.json({ message: "Lavoro non trovato." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    completionNotes?: string;
    internalSummary?: string;
    notes?: string;
  };

  const item = await completeJobAndCaptureSummary(id, body);

  return jsonUpdated({
    message: "Sopralluogo completato.",
    item
  });
}
