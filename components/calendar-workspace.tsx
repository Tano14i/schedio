"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/button";
import { Drawer } from "@/components/drawer";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { Customer, Job, Lead } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type Props = {
  initialCustomers: Customer[];
  initialLeads: Lead[];
  initialJobs: Job[];
  initialOpen: boolean;
  selectedLeadId?: string;
  selectedKind?: "estimate_visit" | "job";
  canSchedule?: boolean;
  defaultAssignedTo?: string;
};

type ScheduleForm = {
  title: string;
  date: string;
  time: string;
  assignedTo: string;
  address: string;
  notes: string;
};

const emptyForm: ScheduleForm = {
  title: "",
  date: "",
  time: "",
  assignedTo: "Sara Colombo",
  address: "",
  notes: ""
};

export function CalendarWorkspace({
  initialCustomers,
  initialLeads,
  initialJobs,
  initialOpen,
  selectedLeadId,
  selectedKind,
  canSchedule = true,
  defaultAssignedTo
}: Props) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [leads, setLeads] = useState(initialLeads);
  const [jobs, setJobs] = useState(initialJobs);
  const [isScheduleOpen, setIsScheduleOpen] = useState(initialOpen);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId),
    [leads, selectedLeadId]
  );
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedLead?.customerId),
    [customers, selectedLead]
  );

  useEffect(() => {
    setIsScheduleOpen(initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    if (!initialOpen || !selectedLead) {
      return;
    }

    const fallbackDate = selectedLead.preferredDate
      ? selectedLead.preferredDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const fallbackTime = selectedLead.preferredDate
      ? selectedLead.preferredDate.slice(11, 16)
      : "09:00";

    setForm({
      title:
        selectedKind === "job"
          ? selectedLead.serviceType
          : `Sopralluogo ${selectedLead.serviceType.toLowerCase()}`,
      date: fallbackDate,
      time: fallbackTime,
      assignedTo: defaultAssignedTo ?? "Sara Colombo",
      address: selectedCustomer?.address ?? "",
      notes: selectedLead.description
    });
  }, [defaultAssignedTo, initialOpen, selectedCustomer, selectedKind, selectedLead]);

  const todayJobs = useMemo(
    () => jobs.filter((job) => job.startAt.startsWith("2026-03-26") || job.startAt.startsWith(new Date().toISOString().slice(0, 10))),
    [jobs]
  );
  const pendingJobs = useMemo(
    () => jobs.filter((job) => job.status !== "completed" && job.status !== "canceled"),
    [jobs]
  );

  function closeDrawer() {
    setIsScheduleOpen(false);
    setForm(emptyForm);
    setFeedback("");
    router.push("/calendar", { scroll: false });
  }

  async function saveSchedule() {
    if (!selectedLead || !selectedCustomer || !form.date || !form.time || !form.title.trim()) {
      setFeedback("Seleziona una richiesta valida, data e ora.");
      return;
    }

    setFeedback("");
    setIsSaving(true);
    const startAt = new Date(`${form.date}T${form.time}:00`).toISOString();

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          customerId: selectedCustomer.id,
          title: form.title.trim(),
          type: selectedKind ?? "estimate_visit",
          assignedTo: form.assignedTo,
          startAt,
          address: form.address.trim() || selectedCustomer.address || "",
          notes: form.notes.trim() || undefined
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.item) {
        setFeedback(result?.message ?? "Impossibile programmare l'appuntamento.");
        return;
      }

      const nextJob: Job = {
        id: result.item.id,
        leadId: result.item.leadId,
        customerId: result.item.customerId,
        title: result.item.title,
        type: result.item.type,
        assignedTo: result.item.assignedTo,
        startAt: result.item.startAt,
        endAt: result.item.endAt,
        status: result.item.status,
        address: result.item.address,
        notes: result.item.notes,
        completionStatus: result.item.completionStatus,
        completedAt: result.item.completedAt,
        completionNotes: result.item.completionNotes,
        internalSummary: result.item.internalSummary,
        estimateDraftedAt: result.item.estimateDraftedAt
      };

      setJobs((current) => [nextJob, ...current]);
      setLeads((current) =>
        current.map((lead) =>
          lead.id === selectedLead.id
            ? {
                ...lead,
                status: selectedKind === "job" ? "won" : "scheduled",
                nextAction:
                  selectedKind === "job"
                    ? "Aprire lavoro e confermare dettagli"
                    : "Aprire appuntamento e confermare dettagli"
              }
            : lead
        )
      );
      closeDrawer();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Calendario"
          title="Organizza sopralluoghi e lavori senza confusione."
          description="Vista giorno e settimana per capire subito chi vedere, dove andare e cosa fare adesso."
          action={canSchedule ? { href: "/calendar?action=schedule", label: "Nuovo appuntamento" } : undefined}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Oggi" value={`${todayJobs.length}`} detail="appuntamenti" />
          <MiniStat label="Attivi" value={`${pendingJobs.length}`} detail="da gestire" />
          <MiniStat
            label="Lead aperti"
            value={`${leads.filter((lead) => lead.status !== "won" && lead.status !== "lost").length}`}
            detail="ancora in pipeline"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <SectionCard
            title="Settimana"
            subtitle="Pianificazione rapida con stati sempre visibili."
            aside={
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {jobs.length} appuntamenti
              </span>
            }
          >
            <div className="space-y-4">
              {jobs.map((job) => {
                const customer = customers.find((item) => item.id === job.customerId);
                const tone =
                  job.type === "estimate_visit"
                    ? "border-primary-200 bg-primary-50"
                    : job.status === "completed"
                      ? "border-neutral-200 bg-neutral-50"
                      : "border-success-200 bg-success-50";

                return (
                  <div key={job.id} className={`rounded-2xl border p-4 ${tone}`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm text-neutral-500">{formatDateTime(job.startAt)}</p>
                        <p className="mt-1 text-base font-semibold text-ink">{job.title}</p>
                        <p className="text-sm text-neutral-600">
                          {customer?.fullName} - {job.address}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-neutral-600">{job.assignedTo}</span>
                        <StatusBadge status={job.status} />
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                        >
                          Apri
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Vista giorno"
            subtitle="Pensata per il tecnico sul campo, con cards verticali e CTA grandi."
            aside={
              <Link
                href={todayJobs[0] ? `/jobs/${todayJobs[0].id}` : "/jobs"}
                className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Apri lavoro
              </Link>
            }
          >
            {todayJobs.length ? (
              <div className="space-y-3">
                {todayJobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-neutral-200 p-4">
                    <p className="text-sm text-neutral-500">{formatDateTime(job.startAt)}</p>
                    <p className="mt-1 font-medium text-ink">{job.title}</p>
                    <p className="text-sm text-neutral-600">{job.assignedTo}</p>
                    <p className="mt-1 text-sm text-neutral-500">{job.address}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <StatusBadge status={job.status} />
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Apri
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nessun appuntamento in programma"
                description="Aggiungi un sopralluogo o un lavoro per iniziare."
                action={
                  canSchedule ? (
                    <button
                      type="button"
                      onClick={() => router.push("/calendar?action=schedule", { scroll: false })}
                      className="inline-flex rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white"
                    >
                      Nuovo appuntamento
                    </button>
                  ) : undefined
                }
              />
            )}
          </SectionCard>
        </div>
      </div>

      {isScheduleOpen && canSchedule ? (
        <Drawer
          title={selectedKind === "job" ? "Pianifica lavoro" : "Pianifica sopralluogo"}
          description={
            selectedLead && selectedCustomer
              ? `${selectedCustomer.fullName} - ${selectedLead.serviceType}`
              : "Programma la prossima azione con data, ora e assegnazione."
          }
          closeHref="/calendar"
        >
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveSchedule();
            }}
          >
            <Field
              label="Cliente"
              value={selectedCustomer?.fullName ?? ""}
              placeholder="Cliente"
              disabled
            />
            <Field label="Titolo" value={form.title} placeholder="Titolo appuntamento" onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Data"
                inputType="date"
                value={form.date}
                placeholder=""
                onChange={(value) => setForm((current) => ({ ...current, date: value }))}
              />
              <Field
                label="Ora"
                inputType="time"
                value={form.time}
                placeholder=""
                onChange={(value) => setForm((current) => ({ ...current, time: value }))}
              />
            </div>
            <Field
              label="Indirizzo"
              value={form.address}
              placeholder="Es. Via Roma 25, Milano"
              onChange={(value) => setForm((current) => ({ ...current, address: value }))}
            />
            <SelectField
              label="Assegnato a"
              value={form.assignedTo}
              onChange={(value) => setForm((current) => ({ ...current, assignedTo: value }))}
              options={["Sara Colombo", "Matteo Riva", "Luca Ferri"]}
            />
            <Field
              label="Note"
              multiline
              value={form.notes}
              placeholder="Aggiungi dettagli utili per questo appuntamento"
              onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" className="sm:order-2">
                {isSaving
                  ? "Salvataggio..."
                  : selectedKind === "job"
                    ? "Programma lavoro"
                    : "Programma sopralluogo"}
              </Button>
              <button
                type="button"
                onClick={closeDrawer}
                className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:order-1"
              >
                Annulla
              </button>
            </div>
            {feedback ? <p className="text-sm text-danger-600">{feedback}</p> : null}
          </form>
        </Drawer>
      ) : null}
    </>
  );
}

function MiniStat({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-neutral-600">{detail}</p>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  multiline,
  inputType,
  disabled
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  inputType?: "text" | "date" | "time";
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300 disabled:bg-neutral-50"
        />
      ) : (
        <input
          type={inputType ?? "text"}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300 disabled:bg-neutral-50"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-primary-300"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
