import { jsonUpdated } from "@/lib/api";
import { getSessionFromRequest, isOwner } from "@/lib/auth";
import { updateUserHourlyCost } from "@/lib/team-server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);

  if (!session || !isOwner(session.role)) {
    return Response.json({ message: "Permessi insufficienti." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    hourlyCost?: number | null;
  };

  const rawValue = body.hourlyCost;
  const normalized =
    rawValue === null || rawValue === undefined || rawValue === ("" as never)
      ? null
      : Number(rawValue);

  if (normalized !== null && (!Number.isFinite(normalized) || normalized < 0)) {
    return Response.json({ message: "Inserisci un costo orario valido." }, { status: 400 });
  }

  const item = await updateUserHourlyCost(id, {
    hourlyCost: normalized
  });

  return jsonUpdated({
    message: "Costo orario aggiornato.",
    item: {
      id: item.id,
      name: item.name,
      role: item.role.toLowerCase(),
      hourlyCost: item.hourlyCost
    }
  });
}
