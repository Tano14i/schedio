"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import type { Customer, Estimate, EstimateAiAssist, EstimateTemplate, Lead } from "@/lib/types";
import { formatCompactDate, formatCurrency } from "@/lib/utils";

type EstimateRecord = Estimate & {
  customerName?: string;
};

export function EstimatesWorkspace({
  initialCustomers,
  initialEstimates,
  initialLeads,
  initialTemplates
}: {
  initialCustomers: Customer[];
  initialEstimates: EstimateRecord[];
  initialLeads: Lead[];
  initialTemplates: EstimateTemplate[];
}) {
  const router = useRouter();
  const [estimates, setEstimates] = useState(initialEstimates);
  const [selectedId, setSelectedId] = useState(initialEstimates[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | "waiting" | "viewed" | "follow_up" | "accepted" | "rejected">("all");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [aiAssist, setAiAssist] = useState<EstimateAiAssist | null>(null);
  const [isAiAssistLoading, setIsAiAssistLoading] = useState(false);

  const selectedEstimate = useMemo(
    () => estimates.find((estimate) => estimate.id === selectedId) ?? estimates[0] ?? null,
    [estimates, selectedId]
  );
  const selectedLead = initialLeads.find((lead) => lead.id === selectedEstimate?.leadId);
  const selectedCustomerName =
    selectedEstimate?.customerName ??
    initialCustomers.find((customer) => customer.id === selectedEstimate?.customerId)?.fullName ??
    "Cliente";
  const filteredEstimates = estimates.filter((estimate) => {
    if (filter === "all") return true;
    if (filter === "waiting") return ["sent", "draft"].includes(estimate.status);
    if (filter === "viewed") return estimate.status === "viewed";
    if (filter === "follow_up") return estimate.followUpStatus === "scheduled" || estimate.followUpStatus === "failed";
    if (filter === "accepted") return estimate.status === "accepted";
    return estimate.status === "rejected";
  });
  const estimateStats = {
    total: estimates.length,
    waiting: estimates.filter((estimate) => ["draft", "sent"].includes(estimate.status)).length,
    followUp: estimates.filter(
      (estimate) => estimate.followUpStatus === "scheduled" || estimate.followUpStatus === "failed"
    ).length
  };

  function updateLocalEstimate(next: EstimateRecord) {
    setEstimates((current) => current.map((estimate) => (estimate.id === next.id ? next : estimate)));
    setSelectedId(next.id);
  }

  useEffect(() => {
    if (!selectedEstimate?.id) {
      setAiAssist(null);
      return;
    }

    let canceled = false;
    setIsAiAssistLoading(true);

    fetch(`/api/estimates/${selectedEstimate.id}/ai-assist`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message ?? "Assistente non disponibile.");
        }

        if (!canceled) {
          setAiAssist((result?.item as EstimateAiAssist) ?? null);
        }
      })
      .catch(() => {
        if (!canceled) {
          setAiAssist(null);
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsAiAssistLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [selectedEstimate?.id]);

  async function patchEstimate(payload: Partial<EstimateRecord>) {
    if (!selectedEstimate) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/estimates/${selectedEstimate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      updateLocalEstimate({
        ...result.item,
        status: result.item.status.toLowerCase(),
        customerName: selectedCustomerName
      });
      setFeedback("Preventivo aggiornato.");
    });
  }

  async function sendEstimate(estimateId: string) {
    setFeedback("");
    startTransition(async () => {
      const currentEstimate = estimates.find((estimate) => estimate.id === estimateId);
      if (!currentEstimate) {
        setFeedback("Preventivo non trovato.");
        return;
      }

      const saveResponse = await fetch(`/api/estimates/${estimateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentEstimate.title,
          scopeSummary: currentEstimate.scopeSummary,
          notes: currentEstimate.notes,
          terms: currentEstimate.terms,
          items: currentEstimate.items
        })
      });

      if (!saveResponse.ok) {
        const saveResult = await saveResponse.json().catch(() => null);
        setFeedback(saveResult?.message ?? "Impossibile salvare la bozza prima dell'invio.");
        return;
      }

      const response = await fetch(`/api/estimates/${estimateId}/send`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile inviare il preventivo.");
        return;
      }

      updateLocalEstimate({
        ...result.item,
        status: result.item.status.toLowerCase(),
        customerName:
          estimates.find((estimate) => estimate.id === estimateId)?.customerName ?? selectedCustomerName
      });
      setFeedback("Preventivo inviato al cliente.");
    });
  }

  async function createInvoiceDraft(estimateId: string) {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/estimates/${estimateId}/create-invoice-draft`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile creare la bozza fattura.");
        return;
      }

      setFeedback("Bozza fattura creata.");
      router.push("/invoices");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preventivi"
        title="Da sopralluogo completato a preventivo inviato in pochi click."
        description="Apri una bozza precompilata, rivedi i dettagli e inviala al cliente senza partire da una pagina vuota."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat label="Totali" value={`${estimateStats.total}`} detail="in elenco" />
        <MiniStat label="In attesa" value={`${estimateStats.waiting}`} detail="da inviare o seguire" />
        <MiniStat label="Follow-up" value={`${estimateStats.followUp}`} detail="da non perdere" />
      </div>

      {selectedEstimate ? (
        <SectionCard
          className="sticky top-3 z-20 border-primary-100 bg-white/95 backdrop-blur xl:static xl:bg-white"
          title="Azioni rapide"
          subtitle="Muovi il preventivo selezionato senza entrare ogni volta nel composer."
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="grid gap-3 sm:grid-cols-3">
              <Meta label="Cliente" value={selectedCustomerName} />
              <Meta label="Preventivo" value={selectedEstimate.number} />
              <Meta label="Stato" value={statusLabel(selectedEstimate.status)} />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Button
                data-tour="estimates-send-client"
                className="w-full sm:w-auto"
                disabled={isPending}
                onClick={() => sendEstimate(selectedEstimate.id)}
              >
                {selectedEstimate.status === "draft" ? "Invia al cliente" : "Reinvia"}
              </Button>
              <ButtonLink
                href={`/public/estimates/${selectedEstimate.publicToken}`}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Apri pagina cliente
              </ButtonLink>
              {selectedEstimate.status === "accepted" ? (
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={() => createInvoiceDraft(selectedEstimate.id)}
                >
                  Crea fattura
                </Button>
              ) : null}
            </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <SectionCard
          className="order-2 xl:order-1"
          title="Lista preventivi"
          subtitle="Filtra l'elenco e apri il preventivo da lavorare adesso."
          aside={
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {[
                ["all", `Tutti (${estimates.length})`],
                ["waiting", `In attesa (${estimateStats.waiting})`],
                ["viewed", `Visti (${estimates.filter((estimate) => estimate.status === "viewed").length})`],
                ["follow_up", `Da seguire (${estimateStats.followUp})`],
                ["accepted", `Accettati (${estimates.filter((estimate) => estimate.status === "accepted").length})`],
                ["rejected", `Rifiutati (${estimates.filter((estimate) => estimate.status === "rejected").length})`]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as typeof filter)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                      filter === value
                        ? "bg-primary-100 text-primary-700"
                        : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {filteredEstimates.length ? (
            <div className="space-y-3">
              {filteredEstimates.map((estimate) => {
                const active = selectedEstimate?.id === estimate.id;
                const customerName =
                  estimate.customerName ??
                  initialCustomers.find((customer) => customer.id === estimate.customerId)?.fullName ??
                  "-";

                return (
                  <div
                    key={estimate.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(estimate.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(estimate.id);
                      }
                    }}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-primary-300 bg-primary-50 shadow-soft"
                        : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{estimate.number}</p>
                        <p className="mt-1 text-sm text-neutral-700">{customerName}</p>
                      </div>
                      <StatusBadge status={estimate.status} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Meta label="Totale" value={formatCurrency(estimate.total)} />
                      <Meta
                        label="Inviato"
                        value={estimate.sentAt ? formatCompactDate(estimate.sentAt) : "Bozza"}
                      />
                      <Meta label="Visto" value={estimate.viewedAt ? "Si" : "No"} />
                      <Meta
                        label="Titolo"
                        value={estimate.title ?? "Preventivo da completare"}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {estimate.followUpStatus ? (
                        <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                          {followUpBadgeLabel(estimate.followUpStatus)}
                        </span>
                      ) : null}
                      {estimate.followUpReason ? (
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                          {estimate.followUpReason === "no_view" ? "Nessuna risposta" : "Visto non accettato"}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                      <Button
                        size="md"
                        variant={estimate.status === "draft" ? "primary" : "secondary"}
                        className="w-full sm:w-auto"
                        disabled={isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          sendEstimate(estimate.id);
                        }}
                      >
                        {estimate.status === "draft" ? "Invia al cliente" : "Reinvia"}
                      </Button>
                      {estimate.status === "accepted" ? (
                        <Button
                          size="md"
                          variant="secondary"
                          className="w-full sm:w-auto"
                          disabled={isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            createInvoiceDraft(estimate.id);
                          }}
                        >
                          Crea fattura
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nessun preventivo ancora"
              description="Completa un sopralluogo e crea la prima bozza in un click."
            />
          )}
        </SectionCard>

        <SectionCard className="order-1 xl:order-2" title="Composer preventivo" subtitle="Precompilato dai dati del sopralluogo.">
          {selectedEstimate ? (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <p className="text-sm font-medium text-ink">Cliente</p>
                  <p className="mt-1 text-base text-neutral-700">{selectedCustomerName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoChip label={selectedEstimate.number} />
                    {selectedEstimate.sentAt ? (
                      <InfoChip label={`Inviato ${formatCompactDate(selectedEstimate.sentAt)}`} />
                    ) : (
                      <InfoChip label="Bozza non inviata" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Stato</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedEstimate.status} />
                  </div>
                </div>
              </div>

              <Field
                label="Titolo preventivo"
                value={selectedEstimate.title ?? ""}
                onChange={(value) => updateLocalEstimate({ ...selectedEstimate, title: value })}
              />
              <Field
                label="Riepilogo intervento"
                value={selectedEstimate.scopeSummary ?? ""}
                textarea
                onChange={(value) => updateLocalEstimate({ ...selectedEstimate, scopeSummary: value })}
              />
              <Field
                label="Note"
                value={selectedEstimate.notes ?? ""}
                textarea
                onChange={(value) => updateLocalEstimate({ ...selectedEstimate, notes: value })}
              />
              <Field
                label="Termini"
                value={selectedEstimate.terms ?? ""}
                textarea
                onChange={(value) => updateLocalEstimate({ ...selectedEstimate, terms: value })}
              />

              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                      Assistente preventivo
                    </p>
                    <p className="mt-2 text-sm text-neutral-700">
                      {isAiAssistLoading
                        ? "Sto ricalcolando voci e rischio margine..."
                        : aiAssist?.summary ?? "Nessun suggerimento AI disponibile per questo preventivo."}
                    </p>
                  </div>
                  {aiAssist ? (
                    <Button
                      variant="secondary"
                      className="w-full lg:w-auto"
                      disabled={isPending}
                      onClick={() =>
                        updateLocalEstimate({
                          ...selectedEstimate,
                          items: aiAssist.suggestedItems.map((item, index) => ({
                            id: selectedEstimate.items[index]?.id ?? `ai-${index}`,
                            label: item.label,
                            description: item.description,
                            qty: item.qty,
                            unitPrice: item.unitPrice
                          })),
                          notes:
                            selectedEstimate.notes ??
                            `Bozza aggiornata con assistente preventivo. Margine target ${aiAssist.targetMarginRate}%.`
                        })
                      }
                    >
                      Applica bozza AI
                    </Button>
                  ) : null}
                </div>

                {aiAssist ? (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricPill label="Costi tracciati" value={formatCurrency(aiAssist.trackedCost)} />
                      <MetricPill
                        label="Margine attuale"
                        value={aiAssist.currentMarginRate !== null ? `${aiAssist.currentMarginRate}%` : "n/d"}
                      />
                      <MetricPill
                        label="Minimo consigliato"
                        value={
                          aiAssist.recommendedMinimumTotal !== null
                            ? formatCurrency(aiAssist.recommendedMinimumTotal)
                            : "n/d"
                        }
                      />
                      <MetricPill
                        label="Margine bozza AI"
                        value={aiAssist.projectedMarginRate !== null ? `${aiAssist.projectedMarginRate}%` : "n/d"}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                        <p className="text-sm font-medium text-ink">Bozza suggerita</p>
                        <div className="mt-3 space-y-2">
                          {aiAssist.suggestedItems.map((item, index) => (
                            <div
                              key={`${item.label}-${index}`}
                              className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm"
                            >
                              <div>
                                <p className="font-medium text-ink">{item.label}</p>
                                {item.description ? (
                                  <p className="mt-1 text-neutral-600">{item.description}</p>
                                ) : null}
                              </div>
                              <div className="text-right text-neutral-700">
                                <p>{item.qty}x</p>
                                <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {aiAssist.alerts.length ? (
                          aiAssist.alerts.map((alert, index) => (
                            <div
                              key={`${alert.title}-${index}`}
                              className={`rounded-2xl border p-4 text-sm ${
                                alert.severity === "high"
                                  ? "border-danger-200 bg-danger-50 text-danger-900"
                                  : alert.severity === "medium"
                                    ? "border-warning-200 bg-warning-50 text-warning-900"
                                    : "border-primary-200 bg-white text-neutral-800"
                              }`}
                            >
                              <p className="font-semibold">{alert.title}</p>
                              <p className="mt-1">{alert.body}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-success-200 bg-success-50 p-4 text-sm text-success-900">
                            Il preventivo non mostra alert critici con i costi registrati oggi.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Voci preventivo</p>
                  <p className="text-xs text-neutral-500">Quantita e prezzo modificabili</p>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedEstimate.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(110px,0.7fr)_minmax(140px,0.7fr)]"
                    >
                      <input
                        className="min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                        value={item.label}
                        onChange={(event) => {
                          const items = [...selectedEstimate.items];
                          items[index] = { ...items[index], label: event.target.value };
                          updateLocalEstimate({ ...selectedEstimate, items });
                        }}
                      />
                      <input
                        type="number"
                        className="min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                        value={item.qty}
                        onChange={(event) => {
                          const items = [...selectedEstimate.items];
                          items[index] = { ...items[index], qty: Number(event.target.value) };
                          updateLocalEstimate({ ...selectedEstimate, items });
                        }}
                      />
                      <input
                        type="number"
                        className="min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                        value={item.unitPrice}
                        onChange={(event) => {
                          const items = [...selectedEstimate.items];
                          items[index] = { ...items[index], unitPrice: Number(event.target.value) };
                          updateLocalEstimate({ ...selectedEstimate, items });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-3">
                <Meta label="Tipo lavoro" value={selectedLead?.serviceType ?? "n/d"} />
                <Meta
                  label="Validita"
                  value={selectedEstimate.validUntil ? formatCompactDate(selectedEstimate.validUntil) : "Da definire"}
                />
                <Meta
                  label="Totale"
                  value={formatCurrency(
                    selectedEstimate.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
                  )}
                  valueClassName="text-lg font-semibold text-ink"
                />
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={() =>
                    patchEstimate({
                      title: selectedEstimate.title,
                      scopeSummary: selectedEstimate.scopeSummary,
                      notes: selectedEstimate.notes,
                      terms: selectedEstimate.terms,
                      items: selectedEstimate.items
                    })
                  }
                >
                  Salva bozza
                </Button>
                <Button
                  data-tour="estimates-send-client"
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={() => sendEstimate(selectedEstimate.id)}
                >
                  Invia al cliente
                </Button>
                <ButtonLink
                  href={`/public/estimates/${selectedEstimate.publicToken}`}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Apri pagina cliente
                </ButtonLink>
                {selectedEstimate.status === "accepted" ? (
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={isPending}
                    onClick={() => createInvoiceDraft(selectedEstimate.id)}
                  >
                    Crea fattura
                  </Button>
                ) : null}
              </div>

              {initialTemplates.length ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Template suggeriti</p>
                  <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                    {initialTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700"
                        onClick={() =>
                          updateLocalEstimate({
                            ...selectedEstimate,
                            title: selectedEstimate.title || `Preventivo ${template.name}`,
                            introText: template.introText,
                            scopeSummary: selectedEstimate.scopeSummary || template.scopeSummary,
                            notes: selectedEstimate.notes || template.notes,
                            terms: selectedEstimate.terms || template.terms,
                            items: template.itemsJson.map((item, index) => ({
                              id: `tmp-${index}`,
                              label: item.label,
                              description: item.description,
                              qty: item.qty,
                              unitPrice: item.unitPrice
                            }))
                          })
                        }
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {feedback ? <p className="text-sm text-primary-700">{feedback}</p> : null}
            </div>
          ) : (
            <EmptyState
              title="Seleziona un preventivo"
              description="Qui puoi rifinire la bozza precompilata e inviarla al cliente."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  readOnly
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  textarea?: boolean;
  readOnly?: boolean;
}) {
  const shared = "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink";

  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {textarea ? (
        <textarea
          className={`${shared} min-h-[96px]`}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      ) : (
        <input
          className={shared}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
        />
      )}
    </label>
  );
}

function Meta({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={`mt-1 text-sm text-neutral-700 ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

function followUpBadgeLabel(status: "scheduled" | "sent" | "canceled" | "failed") {
  const labels = {
    scheduled: "Follow-up schedulato",
    sent: "Follow-up inviato",
    canceled: "Follow-up annullato",
    failed: "Follow-up fallito"
  };

  return labels[status];
}

function statusLabel(status: Estimate["status"]) {
  const labels: Record<Estimate["status"], string> = {
    draft: "Bozza",
    sent: "Inviato",
    viewed: "Visto",
    accepted: "Accettato",
    rejected: "Rifiutato",
    expired: "Scaduto"
  };

  return labels[status];
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

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-soft">
      {label}
    </span>
  );
}
