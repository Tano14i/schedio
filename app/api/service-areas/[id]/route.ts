import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { updateServiceArea } from "@/lib/lead-qualification-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
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
