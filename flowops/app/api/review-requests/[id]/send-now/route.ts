import { jsonUpdated } from "@/lib/api";
import { describeDelivery } from "@/lib/message-format";
import { requireSession } from "@/lib/auth";
import { sendReviewRequestNow } from "@/lib/invoices-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const result = await sendReviewRequestNow(session.companyId, id);
  const delivery = "delivery" in result ? result.delivery : null;
  if (delivery && !delivery.delivered) {
    return Response.json(
      { message: describeDelivery(delivery, "Richiesta recensione", true), delivery },
      { status: 422 }
    );
  }
  return jsonUpdated({
    message: delivery ? describeDelivery(delivery, "Richiesta recensione", true) : "Richiesta recensione gia inviata.",
    item: result,
    delivery
  });
}
