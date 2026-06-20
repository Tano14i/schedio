import { jsonUpdated } from "@/lib/api";
import { markEstimateViewed } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const item = await markEstimateViewed(token);
  return jsonUpdated({
    message: "Preventivo visualizzato.",
    item
  });
}
