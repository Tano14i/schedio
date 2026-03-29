import { jsonUpdated } from "@/lib/api";
import { updateServiceArea } from "@/lib/lead-qualification-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    label?: string;
    city?: string | null;
    postalCodePrefix?: string | null;
    active?: boolean;
  };

  const item = await updateServiceArea(id, body);
  return jsonUpdated({ item });
}
