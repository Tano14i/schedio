import { jsonUpdated } from "@/lib/api";
import { sendEstimateToCustomer } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await sendEstimateToCustomer(id);

  return jsonUpdated({
    message: "Preventivo inviato al cliente.",
    item
  });
}
