import { jsonOk } from "@/lib/api";
import { getFollowUpWorklist } from "@/lib/estimates-server";

export async function GET() {
  const items = await getFollowUpWorklist();
  return jsonOk({ items });
}
