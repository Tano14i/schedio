import { jsonUpdated } from "@/lib/api";
import { sendDueReviewRequests } from "@/lib/invoices-server";

export async function POST() {
  const sent = await sendDueReviewRequests();
  return jsonUpdated({
    message: "Review request elaborate.",
    sent
  });
}
