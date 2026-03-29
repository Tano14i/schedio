import { jsonOk } from "@/lib/api";
import { computeOperationalMetrics } from "@/lib/estimates-server";

export async function GET() {
  const item = await computeOperationalMetrics();
  return jsonOk({ item });
}
