import { jsonUpdated } from "@/lib/api";
import { requestClarification } from "@/lib/lead-qualification-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await requestClarification(id);
  return jsonUpdated({
    message: "Richiesta di chiarimento inviata.",
    item
  });
}
