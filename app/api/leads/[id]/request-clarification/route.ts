import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { requestClarification } from "@/lib/lead-qualification-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await requestClarification(id);
  return jsonUpdated({
    message: "Richiesta di chiarimento inviata.",
    item
  });
}
