import { jsonUpdated } from "@/lib/api";
import { cancelReviewRequest } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await cancelReviewRequest(id);
  return jsonUpdated({
    message: "Review request annullata.",
    item
  });
}
