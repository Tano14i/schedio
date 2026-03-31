import { jsonCreated } from "@/lib/api";
import { getSessionFromRequest, isOwner, isWorker } from "@/lib/auth";
import { getJobByIdForUser, addJobWorkLog } from "@/lib/jobs-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getSessionFromRequest(request);

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

  const body = (await request.json().catch(() => ({}))) as {
    hours?: number;
    hourlyCost?: number;
    note?: string;
    workedAt?: string;
  };

  const hours = Number(body.hours ?? 0);
  if (!Number.isFinite(hours) || hours <= 0) {
    return Response.json({ message: "Inserisci ore valide." }, { status: 400 });
  }

  const item = await addJobWorkLog(id, {
    actorUserId: session.userId,
    hours,
    hourlyCost: isOwner(session.role) ? body.hourlyCost : undefined,
    note: body.note ?? null,
    workedAt: body.workedAt ?? null
  });

  return jsonCreated({
    message: "Ore registrate.",
    item: item.item,
    financials: item.financials
  });
}
