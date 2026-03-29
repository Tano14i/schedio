"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { ActivityLog, Customer, Estimate, Job } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type JobRecord = Job & {
  estimates?: Array<Estimate>;
};

export function JobDetailWorkspace({
  jobId,
  initialJobs,
  initialCustomers,
  initialActivity,
  initialEstimates,
  initialPhotos,
  isOwner
}: {
  jobId: string;
  initialJobs: JobRecord[];
  initialCustomers: Customer[];
  initialActivity: ActivityLog[];
  initialEstimates: Estimate[];
  initialPhotos: string[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [estimates, setEstimates] = useState(initialEstimates);
  const [notes, setNotes] = useState(initialJobs[0]?.notes ?? "");
  const [completionNotes, setCompletionNotes] = useState(
    initialJobs[0]?.completionNotes ?? initialJobs[0]?.notes ?? ""
  );
  const [internalSummary, setInternalSummary] = useState(initialJobs[0]?.internalSummary ?? "");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const job = useMemo(() => jobs.find((item) => item.id === jobId) ?? null, [jobs, jobId]);
  const customer = initialCustomers.find((item) => item.id === job?.customerId);
  const latestEstimate = estimates[0] ?? job?.estimates?.[0] ?? null;
  const jobActivity = initialActivity.filter((item) => item.entityId === jobId);

  if (!job) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Lavoro" title="Lavoro non trovato" description="Torna al calendario per aprire un appuntamento valido." />
        <SectionCard title="Nessun dettaglio disponibile">
          <EmptyState title="Lavoro non trovato" description="Questo appuntamento non esiste oppure non e disponibile." />
        </SectionCard>
      </div>
    );
  }

  function updateLocalJob(next: Partial<JobRecord>) {
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              ...next
            }
          : item
      )
    );
  }

  function patchJob(input: {
    status?: Job["status"];
    notes?: string;
    successMessage: string;
  }) {
    if (!job) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: input.status,
          notes: input.notes
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile aggiornare il lavoro.");
        return;
      }

      updateLocalJob({
        status: result.item.status.toLowerCase(),
        notes: result.item.notes ?? undefined
      });
      if (typeof result.item.notes === "string") {
        setNotes(result.item.notes);
      }
      setFeedback(input.successMessage);
      router.refresh();
    });
  }

  function markCompleted() {
    if (!job) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionNotes,
          internalSummary,
          notes: completionNotes
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile completare il sopralluogo.");
        return;
      }

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: "completed",
                completionStatus: "completed",
                completedAt: new Date().toISOString(),
                notes: completionNotes,
                completionNotes,
                internalSummary
              }
            : item
        )
      );
      setNotes(completionNotes);
      setFeedback("Sopralluogo completato.");
    });
  }

  function createEstimateDraft() {
    if (!job) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/create-estimate-draft`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile creare la bozza preventivo.");
        return;
      }

      setEstimates([{
        ...result.item,
        status: result.item.status.toLowerCase()
      }]);
      setFeedback("Bozza preventivo pronta.");
      router.push("/estimates");
      router.refresh();
    });
  }

  function createInvoiceDraft() {
    if (!job) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/create-invoice-draft`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile creare la bozza fattura.");
        return;
      }

      setFeedback("Bozza fattura pronta.");
      router.push("/invoices");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lavoro"
        title={`${job.title} - ${customer?.fullName ?? "Cliente"}`}
        description={`${formatDateTime(job.startAt)} - ${job.address}`}
        action={{
          href: latestEstimate && isOwner ? "/estimates" : `/jobs/${job.id}`,
          label: latestEstimate && isOwner ? "Apri preventivi" : "Resta sul lavoro"
        }}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Dettagli lavoro" subtitle="Stato, cliente e riepilogo operativo.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Cliente" value={customer?.fullName ?? "-"} />
            <Detail label="Stato" value={<StatusBadge status={job.status} />} />
            <Detail label="Tipo" value={job.type.replaceAll("_", " ")} />
            <Detail label="Orario" value={formatDateTime(job.startAt)} />
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Riepilogo sopralluogo</p>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-ink">Note finali</span>
              <textarea
                className="mt-2 min-h-[110px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                value={completionNotes}
                onChange={(event) => setCompletionNotes(event.target.value)}
              />
            </label>
            <label className="mt-3 block">
              <span className="text-sm font-medium text-ink">Sintesi interna</span>
              <textarea
                className="mt-2 min-h-[96px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                value={internalSummary}
                onChange={(event) => setInternalSummary(event.target.value)}
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Azioni"
          subtitle={
            isOwner
              ? "Chiudi il sopralluogo e passa subito al preventivo."
              : "Aggiorna lo stato del lavoro e chiudi il sopralluogo."
          }
          aside={
            job.completedAt ? (
              <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                Completato {formatDateTime(job.completedAt)}
              </span>
            ) : null
          }
        >
          <div className="space-y-4">
            {job.completionStatus !== "completed" ? (
              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <Button
                  variant={job.status === "scheduled" ? "primary" : "secondary"}
                  disabled={isPending}
                  className="w-full"
                  onClick={() =>
                    patchJob({
                      status: "on_the_way",
                      successMessage: "Stato aggiornato: in arrivo."
                    })
                  }
                >
                  In arrivo
                </Button>
                <Button
                  variant={job.status === "in_progress" ? "primary" : "secondary"}
                  disabled={isPending}
                  className="w-full"
                  onClick={() =>
                    patchJob({
                      status: "in_progress",
                      successMessage: "Stato aggiornato: lavoro in corso."
                    })
                  }
                >
                  Inizia lavoro
                </Button>
                <Button
                  variant="secondary"
                  disabled={isPending}
                  className="w-full"
                  onClick={() => {
                    setCompletionNotes(notes || completionNotes);
                    markCompleted();
                  }}
                >
                  Segna completato
                </Button>
              </div>
            ) : null}

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Note rapide
              </p>
              <textarea
                className="mt-3 min-h-[104px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Aggiungi dettagli utili per il tecnico o il titolare"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Cliente avvisato",
                  "Accesso confermato",
                  "Serve ricambio",
                  "Misure prese sul posto"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setNotes((current) => (current ? `${current}\n${preset}` : preset))
                    }
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-soft"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button
                  variant="secondary"
                  disabled={isPending}
                  className="w-full"
                  onClick={() =>
                    patchJob({
                      notes,
                      successMessage: "Note salvate."
                    })
                  }
                >
                  Salva note
                </Button>
              </div>
            </div>

            {job.completionStatus !== "completed" ? (
              <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                Usa i pulsanti rapidi per aggiornare lo stato mentre sei sul posto.
              </div>
            ) : isOwner ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Button disabled={isPending} onClick={createEstimateDraft} className="w-full">
                  Crea preventivo
                </Button>
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={createInvoiceDraft}
                  className="w-full"
                >
                  Crea fattura
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
                Sopralluogo completato. Il titolare puo ora preparare preventivo e fattura.
              </div>
            )}
            {latestEstimate && isOwner ? (
              <ButtonLink href="/estimates" variant="secondary" className="w-full">
                Apri bozza preventivo
              </ButtonLink>
            ) : null}
            {feedback ? (
              <p className="text-sm text-primary-700">{feedback}</p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Note operative" subtitle="Dettagli utili raccolti sul posto.">
          <p className="text-sm text-neutral-600">{job.notes ?? "Nessuna nota ancora."}</p>
        </SectionCard>
        <SectionCard title="Bozza preventivo" subtitle="Lo stato attuale del passaggio verso la proposta.">
          {latestEstimate ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">{latestEstimate.number}</p>
              <p className="text-sm text-neutral-600">{latestEstimate.title ?? "Preventivo da completare"}</p>
              <StatusBadge status={latestEstimate.status} />
            </div>
          ) : (
            <EmptyState
              title="Nessuna bozza ancora"
              description="Completa il sopralluogo e crea la bozza in un click."
            />
          )}
        </SectionCard>
        <SectionCard title="Foto lavoro" subtitle="Immagini raccolte nel thread o durante l'intake.">
          {initialPhotos.length ? (
            <div className="grid grid-cols-2 gap-3">
              {initialPhotos.map((photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Foto lavoro ${index + 1}`}
                    className="h-32 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nessuna foto disponibile"
              description="Se il cliente ha inviato immagini nel thread WhatsApp, compariranno qui."
            />
          )}
        </SectionCard>
        <SectionCard title="Attivita" subtitle="Eventi recenti collegati al lavoro.">
          {jobActivity.length ? (
            <div className="space-y-3">
              {jobActivity.map((item) => (
                <div key={item.id}>
                  <p className="text-sm font-medium text-ink">{item.message}</p>
                  <p className="text-xs text-neutral-500">{formatDateTime(item.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">Qui compariranno completamento, bozza e invio preventivo.</p>
          )}
        </SectionCard>
      </div>

      {job.completionStatus !== "completed" ? (
        <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-panel backdrop-blur xl:hidden">
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="md"
              variant={job.status === "on_the_way" ? "primary" : "secondary"}
              disabled={isPending}
              className="w-full"
              onClick={() =>
                patchJob({
                  status: "on_the_way",
                  successMessage: "Stato aggiornato: in arrivo."
                })
              }
            >
              In arrivo
            </Button>
            <Button
              size="md"
              variant={job.status === "in_progress" ? "primary" : "secondary"}
              disabled={isPending}
              className="w-full"
              onClick={() =>
                patchJob({
                  status: "in_progress",
                  successMessage: "Stato aggiornato: lavoro in corso."
                })
              }
            >
              In corso
            </Button>
            <Button size="md" disabled={isPending} className="w-full" onClick={markCompleted}>
              Chiudi
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <div className="mt-2 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
