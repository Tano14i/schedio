import { jsonCreated } from "@/lib/api";
import { getSessionFromRequest, isOwner } from "@/lib/auth";
import { createEstimateDraftFromJob } from "@/lib/estimates-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSessionFromRequest(request);

  if (!session || !isOwner(session.role)) {
    return Response.json({ message: "Permessi insufficienti." }, { status: 403 });
  }

  const item = await createEstimateDraftFromJob(id);

  return jsonCreated({
    message: "Bozza preventivo creata dal sopralluogo.",
    item
  });
}
