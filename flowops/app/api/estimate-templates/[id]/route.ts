import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { updateEstimateTemplate } from "@/lib/estimates-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const body = (await request.json()) as Parameters<typeof updateEstimateTemplate>[2];
  const item = await updateEstimateTemplate(session.companyId, id, body);
  return jsonUpdated({
    message: "Template preventivo aggiornato.",
    item
  });
}
