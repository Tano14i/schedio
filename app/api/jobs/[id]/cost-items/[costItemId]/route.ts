import { jsonUpdated } from "@/lib/api";
import { getSessionFromRequest, isOwner } from "@/lib/auth";
import { deleteJobCostItem, getJobByIdForUser } from "@/lib/jobs-server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; costItemId: string }> }
) {
  const { id, costItemId } = await context.params;
  const session = await getSessionFromRequest(request);
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

  if (!session || !isOwner(session.role)) {
    return Response.json({ message: "Solo il titolare puo rimuovere costi." }, { status: 403 });
  }

  const result = await deleteJobCostItem(id, costItemId);

  return jsonUpdated({
    message: "Costo lavoro rimosso.",
    financials: result.financials
  });
}
