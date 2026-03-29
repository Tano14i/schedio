"use client";

import { ActivityTimeline } from "@/components/activity-timeline";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import type { ActivityLog } from "@/lib/types";

export function ActivityWorkspace({
  initialItems,
  notice
}: {
  initialItems: ActivityLog[];
  notice?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity log"
        title="La cronologia che spiega cosa e successo"
        description="Eventi automatici di richieste, appuntamenti, preventivi, fatture e review request."
      />

      {notice ? (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
          {notice}
        </div>
      ) : null}

      <SectionCard title="Eventi recenti" subtitle="Vista unificata per capire cosa e stato fatto e cosa e partito in automatico.">
        <ActivityTimeline items={initialItems} />
      </SectionCard>
    </div>
  );
}
