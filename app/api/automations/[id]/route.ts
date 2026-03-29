import { jsonUpdated } from "@/lib/api";
import { updateAutomation } from "@/lib/automations-server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    enabled?: boolean;
    template?: string;
    delayMinutes?: number;
  };
  const item = await updateAutomation(id, body);
  return jsonUpdated({
    message: "Automazione aggiornata.",
    item
  });
}
