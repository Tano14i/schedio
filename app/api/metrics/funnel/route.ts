import { jsonOk } from "@/lib/api";
import { computeFunnelMetrics } from "@/lib/estimates-server";

export async function GET() {
  const item = await computeFunnelMetrics();
  return jsonOk({ item });
}
