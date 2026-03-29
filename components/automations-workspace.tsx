"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";

type AutomationItem = {
  id: string;
  type: string;
  channel: string;
  enabled: boolean;
  delayMinutes: number;
  template: string;
};

type AutomationLogItem = {
  id: string;
  automationType: string;
  relatedEntityType: string;
  relatedEntityId: string;
  status: string;
  scheduledFor: string;
  sentAt?: string | null;
  errorMessage?: string | null;
};

type QueueSummary = {
  estimateFollowUps: number;
  invoiceReminders: number;
  reviewRequests: number;
  failedRuns: number;
};

export function AutomationsWorkspace({
  automations,
  recentLogs,
  queueSummary
}: {
  automations: AutomationItem[];
  recentLogs: AutomationLogItem[];
  queueSummary: QueueSummary;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  function runNow() {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch("/api/internal/automations/run", { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      const item = result?.item;
      setFeedback(
        `Runner completato. Follow-up: ${item?.estimateFollowUpsSent ?? 0}, reminder fatture: ${item?.invoiceRemindersSent ?? 0}, review request: ${item?.reviewRequestsSent ?? 0}.`
      );
      router.refresh();
    });
  }

  function toggleAutomation(id: string, enabled: boolean) {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      setFeedback("Automazione aggiornata.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automazioni"
        title="Runner, code e ultimi invii in un solo posto."
        description="Qui controlli cosa deve partire, lanci i runner e vedi subito se qualcosa si blocca."
      />

      <SectionCard title="Azioni rapide" subtitle="Controllo veloce delle automazioni operative.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button className="w-full" disabled={isPending} onClick={runNow}>
            {isPending ? "Esecuzione..." : "Esegui automazioni ora"}
          </Button>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Follow-up</p>
            <p className="mt-1 text-lg font-semibold text-ink">{queueSummary.estimateFollowUps}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Reminder fatture</p>
            <p className="mt-1 text-lg font-semibold text-ink">{queueSummary.invoiceReminders}</p>
          </div>
          <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-danger-700">Errori recenti</p>
            <p className="mt-1 text-lg font-semibold text-ink">{queueSummary.failedRuns}</p>
          </div>
        </div>
      </SectionCard>

      {feedback ? (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          {feedback}
        </div>
      ) : null}

      <SectionCard
        title="Controllo rapido"
        subtitle="Esegui i runner adesso e verifica quante automazioni restano in coda."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Follow-up preventivi" value={queueSummary.estimateFollowUps} />
            <SummaryCard label="Reminder fatture" value={queueSummary.invoiceReminders} />
            <SummaryCard label="Review request" value={queueSummary.reviewRequests} />
            <SummaryCard label="Errori recenti" value={queueSummary.failedRuns} tone="danger" />
          </div>
          <Button className="w-full lg:w-auto" disabled={isPending} onClick={runNow}>
            {isPending ? "Esecuzione..." : "Esegui automazioni ora"}
          </Button>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {automations.map((automation) => (
          <SectionCard
            key={automation.id}
            title={automationLabel(automation.type)}
            subtitle={`${channelLabel(automation.channel)} · ${delayLabel(automation.delayMinutes)}`}
            aside={
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  automation.enabled
                    ? "bg-success-50 text-success-700"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {automation.enabled ? "Attiva" : "Disattiva"}
              </span>
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">{automation.template}</p>
              <div className="grid gap-2 sm:flex">
                <Button
                  variant={automation.enabled ? "secondary" : "primary"}
                  size="md"
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={() => toggleAutomation(automation.id, automation.enabled)}
                >
                  {automation.enabled ? "Disattiva" : "Attiva"}
                </Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Ultime esecuzioni" subtitle="Qui vedi cosa è partito e cosa si è bloccato.">
        <div className="space-y-3">
          {recentLogs.length ? (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{automationLabel(log.automationType)}</p>
                    <p className="text-sm text-neutral-600">
                      {entityLabel(log.relatedEntityType)} · {log.relatedEntityId}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      log.status === "FAILED"
                        ? "bg-danger-50 text-danger-700"
                        : log.status === "SENT"
                          ? "bg-success-50 text-success-700"
                          : "bg-warning-50 text-warning-700"
                    }`}
                  >
                    {log.status === "FAILED" ? "Fallita" : log.status === "SENT" ? "Inviata" : "In coda"}
                  </span>
                </div>
                <p className="mt-3 text-xs text-neutral-500">
                  Prevista: {formatDateTime(log.scheduledFor)}
                  {log.sentAt ? ` · Inviata: ${formatDateTime(log.sentAt)}` : ""}
                </p>
                {log.errorMessage ? (
                  <p className="mt-2 text-sm text-danger-600">{log.errorMessage}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-600">Nessuna esecuzione recente.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        tone === "danger" ? "border-danger-200 bg-danger-50" : "border-neutral-200 bg-neutral-50"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function automationLabel(type: string) {
  const labels: Record<string, string> = {
    ESTIMATE_FOLLOWUP: "Follow-up preventivo",
    INVOICE_REMINDER: "Reminder fattura",
    REVIEW_REQUEST: "Richiesta recensione",
    APPOINTMENT_CONFIRMATION: "Conferma appuntamento",
    APPOINTMENT_REMINDER: "Reminder appuntamento"
  };

  return labels[type] ?? type;
}

function channelLabel(channel: string) {
  return channel === "EMAIL" ? "Email" : "SMS";
}

function delayLabel(delayMinutes: number) {
  if (delayMinutes >= 1440) {
    const days = Math.round(delayMinutes / 1440);
    return `${days} giorni`;
  }

  if (delayMinutes >= 60) {
    const hours = Math.round(delayMinutes / 60);
    return `${hours} ore`;
  }

  return `${delayMinutes} minuti`;
}

function entityLabel(entityType: string) {
  const labels: Record<string, string> = {
    estimate_follow_up: "Follow-up preventivo",
    invoice_reminder: "Reminder fattura",
    review_request: "Review request"
  };

  return labels[entityType] ?? entityType;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
