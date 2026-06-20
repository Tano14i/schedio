import { AppShell } from "@/components/app-shell";
import { AutomationsWorkspace } from "@/components/automations-workspace";
import { getAutomationsPageData } from "@/lib/automations-server";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const data = await getAutomationsPageData();

  return (
    <AppShell pathname="/automations">
      <AutomationsWorkspace
        automations={data.automations.map((automation) => ({
          id: automation.id,
          type: automation.type,
          channel: automation.channel,
          enabled: automation.enabled,
          delayMinutes: automation.delayMinutes,
          template: automation.template
        }))}
        recentLogs={data.recentLogs.map((log) => ({
          id: log.id,
          automationType: log.automationType,
          relatedEntityType: log.relatedEntityType,
          relatedEntityId: log.relatedEntityId,
          status: log.status,
          scheduledFor: log.scheduledFor.toISOString(),
          sentAt: log.sentAt?.toISOString() ?? null,
          errorMessage: log.errorMessage ?? null
        }))}
        queueSummary={data.queueSummary}
      />
    </AppShell>
  );
}
