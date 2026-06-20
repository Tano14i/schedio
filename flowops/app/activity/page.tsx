import { AppShell } from "@/components/app-shell";
import { ActivityWorkspace } from "@/components/activity-workspace";
import { getActivityFeed, getActivityMessage } from "@/lib/crm-server";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  try {
    const items = await getActivityFeed();

    return (
      <AppShell pathname="/activity">
        <ActivityWorkspace
          initialItems={items.map((item) => ({
            id: item.id,
            entityType: item.entityType as "lead" | "job" | "estimate" | "invoice" | "customer" | "whatsapp" | "user",
            entityId: item.entityId,
            eventType: item.eventType,
            message: getActivityMessage(item),
            createdAt: item.createdAt.toISOString()
          }))}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/activity">
        <ActivityWorkspace
          initialItems={[]}
          notice="Impossibile caricare il registro attivita adesso. Riprova tra poco."
        />
      </AppShell>
    );
  }
}
