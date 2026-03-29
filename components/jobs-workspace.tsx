"use client";

import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { Job } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type JobListItem = Job & {
  customerName?: string;
};

export function JobsWorkspace({ jobs }: { jobs: JobListItem[] }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lavori"
        title="Apri sopralluoghi e lavori attivi in un solo posto."
        description="Qui trovi i job reali: apri la scheda, aggiorna lo stato e passa al preventivo senza confusione."
      />

      <SectionCard title="Lista lavori" subtitle="Cliente, tipo, orario, stato e prossima azione.">
        {jobs.length ? (
          <>
            <div className="space-y-3 lg:hidden">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">{job.title}</p>
                      <p className="mt-1 text-sm font-medium text-neutral-700">
                        {job.customerName ?? "-"}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-neutral-600">
                    <p>{formatDateTime(job.startAt)}</p>
                    <p>{job.address}</p>
                    <p>{job.assignedTo ? `Assegnato a ${job.assignedTo}` : "Non assegnato"}</p>
                  </div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                  >
                    Apri lavoro
                  </Link>
                </div>
              ))}
            </div>

            <div className="hidden lg:block">
              <DataTable
                columns={[
                  {
                    key: "customer",
                    header: "Cliente",
                    render: (job) => <span className="font-medium text-ink">{job.customerName ?? "-"}</span>
                  },
                  {
                    key: "title",
                    header: "Lavoro",
                    render: (job) => job.title
                  },
                  {
                    key: "date",
                    header: "Data",
                    render: (job) => formatDateTime(job.startAt)
                  },
                  {
                    key: "status",
                    header: "Stato",
                    render: (job) => <StatusBadge status={job.status} />
                  },
                  {
                    key: "actions",
                    header: "Azioni",
                    render: (job) => (
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Apri lavoro
                      </Link>
                    )
                  }
                ]}
                data={jobs}
              />
            </div>
          </>
        ) : (
          <EmptyState
            title="Nessun lavoro disponibile"
            description="Quando programmi un sopralluogo o un intervento, lo vedrai qui."
          />
        )}
      </SectionCard>
    </div>
  );
}
