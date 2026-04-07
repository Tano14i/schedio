import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getFollowUpWorklist } from "@/lib/estimates-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const items = await getFollowUpWorklist();
  return jsonOk({ items });
}
