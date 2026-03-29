import { jsonUpdated } from "@/lib/api";
import { updateEstimateTemplate } from "@/lib/estimates-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as Parameters<typeof updateEstimateTemplate>[1];
  const item = await updateEstimateTemplate(id, body);
  return jsonUpdated({
    message: "Template preventivo aggiornato.",
    item
  });
}
