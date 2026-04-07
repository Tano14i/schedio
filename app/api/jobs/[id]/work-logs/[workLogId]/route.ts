import { jsonOk } from "@/lib/api";
import { getSessionFromRequest, isOwner, isWorker } from "@/lib/auth";
import { deleteJobWorkLog, getJobByIdForUser } from "@/lib/jobs-server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; workLogId: string }> }
) {
  const { id, workLogId } = await context.params;
  const session = await getSessionFromRequest(request);

  if (!session || (!isOwner(session.role) && !isWorker(session.role))) {
    return Response.json({ message: "Sessione non valida." }, { status: 401 });
  }

  const job = await getJobByIdForUser(id, {
    id: session.userId,
    companyId: session.companyId,
    role: session.role
  });

  if (!job) {
    return Response.json({ message: "Lavoro non trovato." }, { status: 404 });
  }

  const result = await deleteJobWorkLog(id, workLogId);
  return jsonOk({
    message: "Ore rimosse.",
    financials: result.financials
  });
}
