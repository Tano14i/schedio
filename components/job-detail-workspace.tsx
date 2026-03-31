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
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
  const [costItems, setCostItems] = useState(initialJobs[0]?.costItems ?? []);
  const [workLogs, setWorkLogs] = useState(initialJobs[0]?.workLogs ?? []);
  const [financials, setFinancials] = useState(initialJobs[0]?.financials ?? null);
  const [costForm, setCostForm] = useState({
    label: "",
    category: "material" as "labor" | "material" | "other",
    qty: "1",
    unitCost: "",
    note: ""
  });
  const [workLogForm, setWorkLogForm] = useState({
    hours: "1",
    note: "",
    workedAt: toDateInputValue(new Date()),
    hourlyCost: initialJobs[0]?.assignedHourlyCost ? String(initialJobs[0].assignedHourlyCost) : ""
  });
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

  function syncJobFinancials(nextFinancials: NonNullable<Job["financials"]> | null) {
    setFinancials(nextFinancials);
    setJobs((current) =>
      current.map((item) =>
        item.id === jobId
          ? {
              ...item,
              financials: nextFinancials ?? undefined
            }
          : item
      )
    );
  }

  function addCostItem() {
    if (!job) {
      return;
    }

    if (!costForm.label.trim() || !costForm.unitCost.trim()) {
      setFeedback("Inserisci voce costo e costo unitario.");
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/cost-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: costForm.label,
          category: costForm.category,
          qty: Number(costForm.qty || 0),
          unitCost: Number(costForm.unitCost || 0),
          note: costForm.note || null
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile aggiungere il costo.");
        return;
      }

      setCostItems((current) => [
        {
          id: result.item.id,
          jobId: result.item.jobId,
          label: result.item.label,
          category: result.item.category.toLowerCase(),
          qty: result.item.qty,
          unitCost: result.item.unitCost,
          note: result.item.note ?? undefined,
          createdAt: result.item.createdAt
        },
        ...current
      ]);
      syncJobFinancials(result.financials);
      setCostForm({
        label: "",
        category: "material",
        qty: "1",
        unitCost: "",
        note: ""
      });
      setFeedback("Costo lavoro aggiunto.");
      router.refresh();
    });
  }

  function removeCostItem(costItemId: string) {
    if (!job) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/cost-items/${costItemId}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile rimuovere il costo.");
        return;
      }

      setCostItems((current) => current.filter((item) => item.id !== costItemId));
      syncJobFinancials(result.financials);
      setFeedback("Costo lavoro rimosso.");
      router.refresh();
    });
  }

  function addWorkLog() {
    if (!job) {
      return;
    }

    if (!workLogForm.hours.trim()) {
      setFeedback("Inserisci le ore lavorate.");
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/work-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: Number(workLogForm.hours || 0),
          note: workLogForm.note || null,
          workedAt: workLogForm.workedAt ? new Date(workLogForm.workedAt).toISOString() : null,
          hourlyCost: isOwner && workLogForm.hourlyCost ? Number(workLogForm.hourlyCost) : undefined
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile registrare le ore.");
        return;
      }

      setWorkLogs((current) => [
        {
          id: result.item.id,
          jobId: result.item.jobId,
          userId: result.item.userId,
          userName: result.item.user.name,
          hours: result.item.hours,
          hourlyCostSnapshot: result.item.hourlyCostSnapshot,
          note: result.item.note ?? undefined,
          workedAt: result.item.workedAt,
          createdAt: result.item.createdAt
        },
        ...current
      ]);
      syncJobFinancials(result.financials);
      setWorkLogForm((current) => ({
        ...current,
        hours: "1",
        note: ""
      }));
      setFeedback("Ore lavorate registrate.");
      router.refresh();
    });
  }

  function removeWorkLog(workLogId: string) {
    if (!job) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/jobs/${job.id}/work-logs/${workLogId}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile rimuovere le ore.");
        return;
      }

      setWorkLogs((current) => current.filter((item) => item.id !== workLogId));
      syncJobFinancials(result.financials);
      setFeedback("Ore lavorate rimosse.");
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
        <SectionCard
          className="order-2 xl:order-1"
          title="Dettagli lavoro"
          subtitle="Stato, cliente e riepilogo operativo."
        >
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
          className="order-1 xl:order-2"
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
        <SectionCard
          title="Margine lavoro"
          subtitle="Controllo rapido di costi, ricavo e margine atteso."
        >
          {financials ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <FinancialCard label="Ricavo atteso" value={formatCurrency(financials.expectedRevenue)} />
                <FinancialCard label="Costi registrati" value={formatCurrency(financials.totalCost)} />
                <FinancialCard
                  label="Margine"
                  value={formatCurrency(financials.margin)}
                  tone={financials.margin >= 0 ? "positive" : "negative"}
                />
                <FinancialCard
                  label="Margine %"
                  value={financials.marginRate !== null ? `${financials.marginRate}%` : "n/d"}
                  tone={
                    financials.marginRate === null
                      ? "neutral"
                      : financials.marginRate >= 0
                        ? "positive"
                        : "negative"
                  }
                />
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                <p>Preventivo: {formatCurrency(financials.estimatedRevenue)}</p>
                <p className="mt-1">Fattura: {formatCurrency(financials.invoicedRevenue)}</p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nessun riepilogo economico"
              description="Aggiungi costi al lavoro per capire subito se il margine regge."
            />
          )}
        </SectionCard>

        <SectionCard title="Costi lavoro" subtitle="Materiali, manodopera e spese registrate.">
          <div className="space-y-4">
            {isOwner ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-ink">Voce costo</span>
                    <input
                      type="text"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={costForm.label}
                      onChange={(event) =>
                        setCostForm((current) => ({ ...current, label: event.target.value }))
                      }
                      placeholder="Es. Ferramenta, 2 ore assistente"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-ink">Categoria</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={costForm.category}
                      onChange={(event) =>
                        setCostForm((current) => ({
                          ...current,
                          category: event.target.value as "labor" | "material" | "other"
                        }))
                      }
                    >
                      <option value="material">Materiale</option>
                      <option value="labor">Manodopera</option>
                      <option value="other">Altro</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-ink">Quantita</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={costForm.qty}
                      onChange={(event) =>
                        setCostForm((current) => ({ ...current, qty: event.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-ink">Costo unitario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={costForm.unitCost}
                      onChange={(event) =>
                        setCostForm((current) => ({ ...current, unitCost: event.target.value }))
                      }
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-ink">Nota</span>
                    <input
                      type="text"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={costForm.note}
                      onChange={(event) =>
                        setCostForm((current) => ({ ...current, note: event.target.value }))
                      }
                      placeholder="Es. Acquisto in ferramenta vicino al cliente"
                    />
                  </label>
                </div>
                <Button disabled={isPending} className="mt-4 w-full" onClick={addCostItem}>
                  Aggiungi costo
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Il titolare puo registrare costi e vedere la marginalita del lavoro.
              </div>
            )}

            {costItems.length ? (
              <div className="space-y-3">
                {costItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-500">
                          {costCategoryLabel(item.category)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        {formatCurrency(item.qty * item.unitCost)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">
                      {item.qty} x {formatCurrency(item.unitCost)}
                    </p>
                    {item.note ? <p className="mt-1 text-sm text-neutral-500">{item.note}</p> : null}
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => removeCostItem(item.id)}
                        className="mt-3 text-sm font-medium text-danger-600 transition hover:text-danger-700"
                      >
                        Rimuovi costo
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nessun costo registrato"
                description="Aggiungi materiali o manodopera per iniziare a misurare la marginalita."
              />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Ore lavorate" subtitle="Tempo registrato sul lavoro dal tecnico o dal titolare.">
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-ink">Ore</span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.25"
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                    value={workLogForm.hours}
                    onChange={(event) =>
                      setWorkLogForm((current) => ({ ...current, hours: event.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink">Data lavoro</span>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                    value={workLogForm.workedAt}
                    onChange={(event) =>
                      setWorkLogForm((current) => ({ ...current, workedAt: event.target.value }))
                    }
                  />
                </label>
                {isOwner ? (
                  <label className="block">
                    <span className="text-sm font-medium text-ink">Costo orario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                      value={workLogForm.hourlyCost}
                      onChange={(event) =>
                        setWorkLogForm((current) => ({
                          ...current,
                          hourlyCost: event.target.value
                        }))
                      }
                      placeholder={
                        job.assignedHourlyCost
                          ? `Default ${formatCurrency(job.assignedHourlyCost)}`
                          : "Es. 28"
                      }
                    />
                  </label>
                ) : null}
                <label className={`block ${isOwner ? "sm:col-span-2" : "sm:col-span-2"}`}>
                  <span className="text-sm font-medium text-ink">Nota</span>
                  <input
                    type="text"
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                    value={workLogForm.note}
                    onChange={(event) =>
                      setWorkLogForm((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="Es. uscita, montaggio, finitura"
                  />
                </label>
              </div>
              {!isOwner && !job.assignedHourlyCost ? (
                <p className="mt-3 text-sm text-amber-700">
                  Le ore verranno registrate, ma il margine sara preciso solo quando il titolare
                  imposta un costo orario.
                </p>
              ) : null}
              <Button disabled={isPending} className="mt-4 w-full" onClick={addWorkLog}>
                Registra ore
              </Button>
            </div>

            {workLogs.length ? (
              <div className="space-y-3">
                {workLogs.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.userName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-500">
                          {formatDateTime(item.workedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ink">{item.hours}h</p>
                        {isOwner ? (
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatCurrency(item.hours * item.hourlyCostSnapshot)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {isOwner ? (
                      <p className="mt-2 text-sm text-neutral-600">
                        {formatCurrency(item.hourlyCostSnapshot)}/h
                      </p>
                    ) : null}
                    {item.note ? <p className="mt-1 text-sm text-neutral-500">{item.note}</p> : null}
                    <button
                      type="button"
                      onClick={() => removeWorkLog(item.id)}
                      className="mt-3 text-sm font-medium text-danger-600 transition hover:text-danger-700"
                    >
                      Rimuovi ore
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nessuna ora registrata"
                description="Il tecnico puo segnare il tempo speso e farlo entrare nel margine del lavoro."
              />
            )}
          </div>
        </SectionCard>

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
            <div className="grid gap-3 sm:grid-cols-2">
              {initialPhotos.map((photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Foto lavoro ${index + 1}`}
                    className="h-44 w-full object-cover sm:h-32"
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
        <div className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-panel backdrop-blur xl:hidden sm:inset-x-4">
          <div className="grid gap-2 sm:grid-cols-3">
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

function FinancialCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "positive"
          ? "border-success-200 bg-success-50"
          : tone === "negative"
            ? "border-danger-200 bg-danger-50"
            : "border-neutral-200 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function costCategoryLabel(category: "labor" | "material" | "other") {
  if (category === "labor") {
    return "Manodopera";
  }
  if (category === "material") {
    return "Materiale";
  }
  return "Altro";
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
