import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { computeOperationalMetrics } from "@/lib/estimates-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const item = await computeOperationalMetrics();
  return jsonOk({ item });
}
