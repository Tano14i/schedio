import { jsonUpdated } from "@/lib/api";
import { describeDelivery } from "@/lib/message-format";
import { requireSession } from "@/lib/auth";
import { requestClarification } from "@/lib/lead-qualification-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await requestClarification(session.companyId, id);
  return jsonUpdated({
    message: describeDelivery(item.delivery, "Richiesta di chiarimento", true),
    item
  });
}
