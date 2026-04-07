import { jsonCreated } from "@/lib/api";
import { getSessionFromRequest, isOwner } from "@/lib/auth";
import { addJobCostItem, getJobByIdForUser } from "@/lib/jobs-server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
    return Response.json({ message: "Solo il titolare puo aggiungere costi." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    label?: string;
    category?: "labor" | "material" | "other";
    qty?: number;
    unitCost?: number;
    note?: string | null;
  };

  if (!body.label?.trim() || !body.category || !body.qty || body.unitCost === undefined) {
    return Response.json(
      { message: "Inserisci voce costo, categoria, quantita e costo unitario." },
      { status: 400 }
    );
  }

  const result = await addJobCostItem(id, {
    label: body.label,
    category: body.category,
    qty: Number(body.qty),
    unitCost: Number(body.unitCost),
    note: body.note
  });

  return jsonCreated({
    message: "Costo lavoro aggiunto.",
    item: result.item,
    financials: result.financials
  });
}
