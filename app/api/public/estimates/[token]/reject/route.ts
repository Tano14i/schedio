import { jsonUpdated } from "@/lib/api";
import { rejectEstimate } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const item = await rejectEstimate(token);
  return jsonUpdated({
    message: "Preventivo rifiutato.",
    item
  });
}
