import { jsonOk, jsonUpdated } from "@/lib/api";
import { getSessionFromRequest, isOwner } from "@/lib/auth";
import { sanitizeJobPatchForRole } from "@/lib/authz";
import { getJobByIdForUser, updateJob } from "@/lib/jobs-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ message: "Non autorizzato." }, { status: 401 });
  }
  const item = await getJobByIdForUser(
    id,
    {
      id: session.userId,
      companyId: session.companyId,
      role: session.role
    }
  );
  if (!item) {
    return Response.json({ message: "Lavoro non trovato." }, { status: 404 });
  }
  return jsonOk({ item });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
    title?: string;
    assignedTo?: string | null;
    startAt?: string;
    endAt?: string | null;
    status?: "scheduled" | "on_the_way" | "in_progress" | "completed" | "canceled";
    address?: string;
    notes?: string | null;
  };

  const nextBody = session && !isOwner(session.role)
    ? sanitizeJobPatchForRole("WORKER", body)
    : body;

  const item = await updateJob(session.companyId, id, nextBody);
  return jsonUpdated({
    message: "Lavoro aggiornato.",
    item
  });
}
