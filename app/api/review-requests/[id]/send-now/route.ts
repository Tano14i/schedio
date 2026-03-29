import { jsonUpdated } from "@/lib/api";
import { sendReviewRequestNow } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await sendReviewRequestNow(id);
  return jsonUpdated({
    message: "Review request inviata.",
    item
  });
}
