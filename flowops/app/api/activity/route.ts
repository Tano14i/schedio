import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getActivityFeed, getActivityMessage } from "@/lib/crm-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const items = await getActivityFeed();
  return jsonOk({
    items: items.map((item) => ({
      id: item.id,
      entityType: item.entityType as "lead" | "job" | "estimate" | "invoice" | "customer" | "whatsapp" | "user",
      entityId: item.entityId,
      eventType: item.eventType,
      message: getActivityMessage(item),
      createdAt: item.createdAt.toISOString()
    }))
  });
}
