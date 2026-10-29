import { jsonUpdated } from "@/lib/api";
import { describeDelivery } from "@/lib/message-format";
import { requireSession } from "@/lib/auth";
import { sendEstimateToCustomer } from "@/lib/estimates-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const { delivery, ...item } = await sendEstimateToCustomer(session.companyId, id);

  return jsonUpdated({
    message: describeDelivery(delivery, "Preventivo"),
    item,
    delivery
  });
}
