"use client";

import Link from "next/link";
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
        eyebrow="Registro attivita"
        title="La cronologia che spiega cosa e successo"
        description="Eventi automatici di richieste, appuntamenti, preventivi, fatture e richieste di recensione."
      />

      <SectionCard title="Azioni rapide" subtitle="Vai subito dove serve senza leggere tutta la timeline.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/leads" label="Apri richieste" />
          <QuickLink href="/jobs" label="Apri lavori" />
          <QuickLink href="/estimates" label="Apri preventivi" />
          <QuickLink href="/invoices" label="Apri fatture" />
        </div>
      </SectionCard>

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

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
    >
      {label}
    </Link>
  );
}
