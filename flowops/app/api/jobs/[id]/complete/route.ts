import { jsonUpdated } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";
import { completeJobAndCaptureSummary } from "@/lib/estimates-server";
import { getJobByIdForUser } from "@/lib/jobs-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ message: "Non autorizzato." }, { status: 401 });
  }
  const job = await getJobByIdForUser(
    id,
    {
      id: session.userId,
      companyId: session.companyId,
      role: session.role
    }
  );

  if (!job) {
    return Response.json({ message: "Lavoro non trovato." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    completionNotes?: string;
    internalSummary?: string;
    notes?: string;
  };

  const item = await completeJobAndCaptureSummary(session.companyId, id, body);

  return jsonUpdated({
    message: "Sopralluogo completato.",
    item
  });
}
