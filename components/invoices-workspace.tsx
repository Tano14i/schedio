"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import type {
  Customer,
  Invoice,
  InvoiceMetrics,
  InvoiceReminderAiAssist,
  InvoiceWorkItem,
  ReviewRequest
} from "@/lib/types";
import { formatCompactDate, formatCurrency } from "@/lib/utils";

type InvoiceRecord = Invoice & {
  customerName?: string;
};

export function InvoicesWorkspace({
  initialCustomers,
  initialInvoices,
  initialMetrics,
  initialWorklist,
  initialReviewRequests
}: {
  initialCustomers: Customer[];
  initialInvoices: InvoiceRecord[];
  initialMetrics: InvoiceMetrics;
  initialWorklist: InvoiceWorkItem[];
  initialReviewRequests: ReviewRequest[];
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedId, setSelectedId] = useState(initialInvoices[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | "draft" | "sent" | "paid" | "overdue" | "due">("all");
  const [reviewRequests, setReviewRequests] = useState(initialReviewRequests);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [aiReminderAssist, setAiReminderAssist] = useState<InvoiceReminderAiAssist | null>(null);
  const [isAiReminderLoading, setIsAiReminderLoading] = useState(false);

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedId) ?? invoices[0] ?? null,
    [invoices, selectedId]
  );
  const selectedCustomerName =
    selectedInvoice?.customerName ??
    initialCustomers.find((customer) => customer.id === selectedInvoice?.customerId)?.fullName ??
    "Cliente";

  useEffect(() => {
    if (!selectedInvoice?.id || !["sent", "overdue"].includes(selectedInvoice.status)) {
      setAiReminderAssist(null);
      return;
    }

    let canceled = false;
    setIsAiReminderLoading(true);

    fetch(`/api/invoices/${selectedInvoice.id}/ai-reminder`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.message ?? "Assistente reminder non disponibile.");
        }

        if (!canceled) {
          setAiReminderAssist((result?.item as InvoiceReminderAiAssist | null) ?? null);
        }
      })
      .catch(() => {
        if (!canceled) {
          setAiReminderAssist(null);
        }
      })
      .finally(() => {
        if (!canceled) {
          setIsAiReminderLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [selectedInvoice?.id, selectedInvoice?.status]);

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter === "all") return true;
    if (filter === "due") return invoice.latestReminderStatus === "scheduled" || isOverdue(invoice);
    return invoice.status === filter;
  });

  const worklist = useMemo(() => buildWorklist(invoices, initialCustomers, reviewRequests), [invoices, initialCustomers, reviewRequests]);
  const metrics = useMemo(() => buildMetrics(invoices, reviewRequests), [invoices, reviewRequests]);

  function updateLocalInvoice(next: InvoiceRecord) {
    setInvoices((current) => current.map((invoice) => (invoice.id === next.id ? next : invoice)));
    setSelectedId(next.id);
  }

  function patchInvoice(payload: Partial<InvoiceRecord>) {
    if (!selectedInvoice) {
      return;
    }

    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile aggiornare la fattura.");
        return;
      }

      updateLocalInvoice(normalizeInvoice(result.item, selectedCustomerName));
      setFeedback("Fattura aggiornata.");
    });
  }

  function sendInvoice(invoiceId: string) {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile inviare la fattura.");
        return;
      }

      const current = invoices.find((invoice) => invoice.id === invoiceId);
      updateLocalInvoice(normalizeInvoice(result.item, current?.customerName));
      setFeedback("Fattura inviata al cliente.");
    });
  }

  function payInvoice(invoiceId: string) {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile registrare il pagamento.");
        return;
      }

      const current = invoices.find((invoice) => invoice.id === invoiceId);
      updateLocalInvoice(normalizeInvoice(result.item, current?.customerName));

      const reviewResponse = await fetch("/api/review-requests");
      const reviewResult = await reviewResponse.json().catch(() => null);
      if (reviewResponse.ok && reviewResult?.items) {
        setReviewRequests(reviewResult.items);
      }

      setFeedback("Pagamento registrato e review request pianificata.");
    });
  }

  function sendReviewNow(reviewRequestId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/review-requests/${reviewRequestId}/send-now`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        setFeedback(result?.message ?? "Impossibile inviare la review request.");
        return;
      }

      setReviewRequests((current) =>
        current.map((item) =>
          item.id === reviewRequestId
            ? {
                ...item,
                status: "sent",
                sentAt: new Date().toISOString()
              }
            : item
        )
      );
      setFeedback("Review request inviata.");
    });
  }

  function sendReminderNow(invoiceId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/schedule-reminder`, { method: "POST" });
      await response.json().catch(() => null);
      await fetch("/api/internal/invoice-reminders/run", { method: "POST" });
      const refresh = await fetch("/api/invoices");
      const result = await refresh.json().catch(() => null);

      if (refresh.ok && result?.items) {
        setInvoices(result.items.map((item: InvoiceRecord) => normalizeInvoice(item)));
      }

      setFeedback("Reminder fattura inviato.");
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fatture"
        title="Chiudi il lavoro fino all'incasso e alla recensione."
        description="Crea fatture da preventivi accettati o lavori completati, segna il pagamento e lascia che Schedio faccia partire il reminder e la review request."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fatture aperte" value={`${metrics.openInvoices}`} detail="Da incassare" accent="sand" />
        <StatCard label="Fatture scadute" value={`${metrics.overdueInvoices}`} detail="Da sollecitare" />
        <StatCard label="Incassato mese" value={formatCurrency(metrics.cashCollectedMonth)} detail="Cassa registrata" />
        <StatCard label="Review request inviate" value={`${metrics.reviewRequestsSent}`} detail={`${metrics.reviewRequestsClicked} cliccate`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <SectionCard
          className="order-2 xl:order-1"
          title="Lista fatture"
          subtitle="Apri una bozza, invia, incassa o sollecita senza perdere contesto."
          aside={
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {[
                ["all", "Tutte"],
                ["draft", "Bozze"],
                ["sent", "Inviate"],
                ["paid", "Pagate"],
                ["overdue", "Scadute"],
                ["due", "Da sollecitare"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as typeof filter)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    filter === value ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {filteredInvoices.length ? (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => {
                const active = selectedInvoice?.id === invoice.id;
                const customerName =
                  invoice.customerName ??
                  initialCustomers.find((customer) => customer.id === invoice.customerId)?.fullName ??
                  "-";

                return (
                  <div
                    key={invoice.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(invoice.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(invoice.id);
                      }
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-primary-300 bg-primary-50 shadow-soft"
                        : "border-neutral-200 bg-white hover:border-primary-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{invoice.number}</p>
                        <p className="mt-1 text-sm text-neutral-700">{customerName}</p>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Meta label="Totale" value={formatCurrency(invoice.total)} />
                      <Meta label="Scadenza" value={invoice.dueDate ? formatCompactDate(invoice.dueDate) : "Da definire"} />
                      <Meta label="Inviata" value={invoice.sentAt ? formatCompactDate(invoice.sentAt) : "Bozza"} />
                      <Meta label="Pagata" value={invoice.paidAt ? formatCompactDate(invoice.paidAt) : "No"} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {invoice.latestReminderStatus ? (
                        <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                          {invoice.latestReminderStatus === "scheduled" ? "Reminder schedulato" : "Reminder inviato"}
                        </span>
                      ) : null}
                      {isOverdue(invoice) ? (
                        <span className="rounded-full bg-danger-50 px-3 py-1 text-xs font-medium text-danger-700">
                          Scaduta
                        </span>
                      ) : null}
                    </div>

                  <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                      {invoice.status === "draft" ? (
                        <Button
                          size="md"
                          className="w-full sm:w-auto"
                          disabled={isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            sendInvoice(invoice.id);
                          }}
                        >
                          Invia fattura
                        </Button>
                      ) : null}
                      {invoice.status === "sent" || invoice.status === "overdue" ? (
                        <Button
                          size="md"
                          variant="secondary"
                          className="w-full sm:w-auto"
                          disabled={isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            payInvoice(invoice.id);
                          }}
                        >
                          Segna pagata
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nessuna fattura ancora"
              description="Quando un preventivo viene accettato o un lavoro è completato, puoi creare la fattura in pochi click."
            />
          )}
        </SectionCard>

        <SectionCard className="order-1 xl:order-2" title="Composer fattura" subtitle="Rivedi i dettagli prima dell'invio al cliente.">
          {selectedInvoice ? (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <p className="text-sm font-medium text-ink">Cliente</p>
                  <p className="mt-1 text-base text-neutral-700">{selectedCustomerName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <InfoChip label={selectedInvoice.number} />
                    {selectedInvoice.sentAt ? (
                      <InfoChip label={`Inviata ${formatCompactDate(selectedInvoice.sentAt)}`} />
                    ) : (
                      <InfoChip label="Bozza non inviata" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Stato</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </div>
              </div>

              <Field
                label="Titolo fattura"
                value={selectedInvoice.title ?? ""}
                onChange={(value) => updateLocalInvoice({ ...selectedInvoice, title: value })}
              />
              <Field
                label="Note"
                value={selectedInvoice.notes ?? ""}
                textarea
                onChange={(value) => updateLocalInvoice({ ...selectedInvoice, notes: value })}
              />
              <Field
                label="Termini"
                value={selectedInvoice.terms ?? ""}
                textarea
                onChange={(value) => updateLocalInvoice({ ...selectedInvoice, terms: value })}
              />
              <Field
                label="Scadenza"
                value={selectedInvoice.dueDate?.slice(0, 10) ?? ""}
                type="date"
                onChange={(value) =>
                  updateLocalInvoice({
                    ...selectedInvoice,
                    dueDate: value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined
                  })
                }
              />

              {(selectedInvoice.status === "sent" || selectedInvoice.status === "overdue") ? (
                <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                        Assistente reminder
                      </p>
                      <p className="mt-2 text-sm text-neutral-700">
                        {isAiReminderLoading
                          ? "Sto preparando il messaggio piu adatto per il sollecito..."
                          : aiReminderAssist?.summary ?? "Nessun suggerimento reminder disponibile."}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full lg:w-auto"
                      disabled={isPending}
                      onClick={() => sendReminderNow(selectedInvoice.id)}
                    >
                      Sollecita ora
                    </Button>
                  </div>

                  {aiReminderAssist ? (
                    <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
                      <MetricPill
                        label="Prossimo passo"
                        value={
                          aiReminderAssist.recommendation === "call_customer"
                            ? "Meglio chiamare il cliente"
                            : "Reminder pronto da inviare"
                        }
                      />
                      <div className="rounded-2xl border border-white/60 bg-white/80 p-4">
                        <p className="text-sm font-medium text-ink">Messaggio suggerito</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                          {aiReminderAssist.message}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Voci fattura</p>
                  <p className="text-xs text-neutral-500">Aggiorna importi e quantità in pochi secondi</p>
                </div>
                <div className="mt-3 space-y-3">
                  {(selectedInvoice.items ?? []).map((item, index) => (
                    <div
                      key={item.id}
                      className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(110px,0.7fr)_minmax(140px,0.7fr)]"
                    >
                      <input
                        className="min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                        value={item.label}
                        onChange={(event) => {
                          const items = [...(selectedInvoice.items ?? [])];
                          items[index] = { ...items[index], label: event.target.value };
                          updateLocalInvoice({ ...selectedInvoice, items });
                        }}
                      />
                      <input
                        type="number"
                        className="min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                        value={item.qty}
                        onChange={(event) => {
                          const items = [...(selectedInvoice.items ?? [])];
                          items[index] = { ...items[index], qty: Number(event.target.value) };
                          updateLocalInvoice({ ...selectedInvoice, items });
                        }}
                      />
                      <input
                        type="number"
                        className="min-w-0 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink"
                        value={item.unitPrice}
                        onChange={(event) => {
                          const items = [...(selectedInvoice.items ?? [])];
                          items[index] = { ...items[index], unitPrice: Number(event.target.value) };
                          updateLocalInvoice({ ...selectedInvoice, items });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-3">
                <Meta label="Totale" value={formatCurrency(sumInvoice(selectedInvoice))} valueClassName="text-lg font-semibold text-ink" />
                <Meta label="Scadenza" value={selectedInvoice.dueDate ? formatCompactDate(selectedInvoice.dueDate) : "Da definire"} />
                <Meta label="Pagina cliente" value={selectedInvoice.sentAt ? "Pronta" : "Si attiva all'invio"} />
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={isPending}
                  onClick={() =>
                    patchInvoice({
                      title: selectedInvoice.title,
                      notes: selectedInvoice.notes,
                      terms: selectedInvoice.terms,
                      dueDate: selectedInvoice.dueDate,
                      items: selectedInvoice.items
                    })
                  }
                >
                  Salva bozza
                </Button>
                {selectedInvoice.status === "draft" ? (
                  <Button
                    className="w-full sm:w-auto"
                    disabled={isPending}
                    onClick={() => sendInvoice(selectedInvoice.id)}
                  >
                    Invia al cliente
                  </Button>
                ) : null}
                {(selectedInvoice.status === "sent" || selectedInvoice.status === "overdue") ? (
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={isPending}
                    onClick={() => payInvoice(selectedInvoice.id)}
                  >
                    Segna pagata
                  </Button>
                ) : null}
                <ButtonLink
                  href={`/public/invoices/${selectedInvoice.publicToken}`}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Apri fattura
                </ButtonLink>
              </div>

              {feedback ? <p className="text-sm text-primary-700">{feedback}</p> : null}
            </div>
          ) : (
            <EmptyState
              title="Seleziona una fattura"
              description="Qui puoi rifinire la bozza, inviarla al cliente e registrare il pagamento."
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Da incassare" subtitle="Le fatture che richiedono azione oggi.">
          <div className="space-y-3">
            {worklist.length ? (
              worklist.map((item) => (
                <div key={item.invoiceId} className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-ink">{item.customerName}</p>
                      <p className="mt-1 text-sm text-neutral-600">
                        {item.number} · {formatCurrency(item.total)}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {item.dueDate ? `Scadenza ${formatCompactDate(item.dueDate)}` : "Scadenza da definire"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.reminderStatus !== "none" ? (
                        <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-700">
                          {item.reminderStatus === "due" ? "Da sollecitare" : `Reminder ${item.reminderStatus}`}
                        </span>
                      ) : null}
                      {item.reviewRequestStatus ? (
                        <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
                          {item.reviewRequestStatus === "due" ? "Review da inviare" : `Review ${item.reviewRequestStatus}`}
                        </span>
                      ) : null}
                      {item.recommendation === "send_reminder" ? (
                        <Button
                          size="md"
                          variant="secondary"
                          className="w-full sm:w-auto"
                          disabled={isPending}
                          onClick={() => sendReminderNow(item.invoiceId)}
                        >
                          Sollecita ora
                        </Button>
                      ) : null}
                      {item.recommendation === "mark_paid" ? (
                        <Button
                          size="md"
                          variant="secondary"
                          className="w-full sm:w-auto"
                          disabled={isPending}
                          onClick={() => payInvoice(item.invoiceId)}
                        >
                          Segna pagata
                        </Button>
                      ) : null}
                      {item.recommendation === "send_review" ? (
                        <Button
                          size="md"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => {
                            const review = reviewRequests.find((entry) => entry.invoiceId === item.invoiceId && entry.status === "pending");
                            if (review) {
                              sendReviewNow(review.id);
                            }
                          }}
                        >
                          Invia review
                        </Button>
                      ) : null}
                      <ButtonLink href="/invoices" variant="secondary" size="md" className="w-full sm:w-auto">
                        Apri fatture
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-600">Nessuna fattura da sollecitare oggi.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Review request" subtitle="Programmate o inviate dopo l'incasso.">
          <div className="space-y-3">
            {reviewRequests.length ? (
              reviewRequests.map((item) => {
                const customerName =
                  initialCustomers.find((customer) => customer.id === item.customerId)?.fullName ?? "Cliente";

                return (
                  <div key={item.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium text-ink">{customerName}</p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {item.sentAt
                            ? `Inviata il ${formatCompactDate(item.sentAt)}`
                            : item.scheduledFor
                              ? `Programmato per ${formatCompactDate(item.scheduledFor)}`
                              : "Da programmare"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                          {reviewStatusLabel(item.status)}
                        </span>
                        {item.status === "pending" ? (
                          <Button
                            size="md"
                            variant="secondary"
                            className="w-full sm:w-auto"
                            disabled={isPending}
                            onClick={() => sendReviewNow(item.id)}
                          >
                            Invia ora
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="Nessuna review request ancora"
                description="Quando una fattura viene pagata, qui compare la richiesta recensione pianificata."
              />
            )}
          </div>
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
  type = "text"
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  const shared = "mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink";

  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {textarea ? (
        <textarea className={`${shared} min-h-[96px]`} value={value} onChange={(event) => onChange?.(event.target.value)} />
      ) : (
        <input className={shared} value={value} type={type} onChange={(event) => onChange?.(event.target.value)} />
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

function normalizeInvoice(invoice: InvoiceRecord, customerName?: string): InvoiceRecord {
  return {
    ...invoice,
    status: invoice.status.toLowerCase() as InvoiceRecord["status"],
    latestReminderStatus: invoice.latestReminderStatus?.toLowerCase() as InvoiceRecord["latestReminderStatus"],
    customerName: customerName ?? invoice.customerName
  };
}

function sumInvoice(invoice: InvoiceRecord) {
  return Number(
    (invoice.items ?? []).reduce((sum, item) => sum + Number(item.qty) * Number(item.unitPrice), 0).toFixed(2)
  );
}

function isOverdue(invoice: InvoiceRecord) {
  return Boolean(invoice.dueDate && !invoice.paidAt && new Date(invoice.dueDate) < new Date());
}

function buildMetrics(invoices: InvoiceRecord[], reviewRequests: ReviewRequest[]): InvoiceMetrics {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidWithTiming = invoices.filter((invoice) => invoice.sentAt && invoice.paidAt);
  const avgInvoiceSentToPaidHours = paidWithTiming.length
    ? Number(
        (
          paidWithTiming.reduce(
            (sum, invoice) =>
              sum + (new Date(invoice.paidAt!).getTime() - new Date(invoice.sentAt!).getTime()) / 36e5,
            0
          ) / paidWithTiming.length
        ).toFixed(1)
      )
    : null;

  return {
    openInvoices: invoices.filter((invoice) => invoice.status === "sent").length,
    overdueInvoices: invoices.filter((invoice) => isOverdue(invoice)).length,
    paidInvoices: invoices.filter((invoice) => invoice.status === "paid").length,
    cashCollectedMonth: Number(
      invoices
        .filter((invoice) => invoice.paidAt && new Date(invoice.paidAt) >= startOfMonth)
        .reduce((sum, invoice) => sum + invoice.total, 0)
        .toFixed(2)
    ),
    reviewRequestsSent: reviewRequests.filter((item) => item.status === "sent" || item.status === "clicked").length,
    reviewRequestsClicked: reviewRequests.filter((item) => item.status === "clicked").length,
    avgInvoiceSentToPaidHours
  };
}

function buildWorklist(invoices: InvoiceRecord[], customers: Customer[], reviewRequests: ReviewRequest[]): InvoiceWorkItem[] {
  const now = new Date();

  return invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "paid")
    .map((invoice) => {
      const reminderStatus = isOverdue(invoice) ? "due" : invoice.latestReminderStatus ?? "none";

      const recommendation =
        reminderStatus === "due" ? "send_reminder" : invoice.status === "sent" ? "mark_paid" : "send_invoice";

      return {
        invoiceId: invoice.id,
        customerName: invoice.customerName ?? customers.find((customer) => customer.id === invoice.customerId)?.fullName ?? "Cliente",
        number: invoice.number,
        total: invoice.total,
        dueDate: invoice.dueDate ?? null,
        sentAt: invoice.sentAt ?? null,
        paidAt: invoice.paidAt ?? null,
        reminderStatus: reminderStatus as "scheduled" | "sent" | "canceled" | "failed" | "due" | "none",
        recommendation: recommendation as "send_invoice" | "send_reminder" | "mark_paid" | "send_review"
      };
    })
    .filter((item) => item.reminderStatus === "due" || item.recommendation === "mark_paid");
}

function reviewStatusLabel(status: ReviewRequest["status"]) {
  const labels: Record<ReviewRequest["status"], string> = {
    pending: "Programmato",
    sent: "Inviata",
    clicked: "Cliccata",
    canceled: "Annullata"
  };

  return labels[status];
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-soft">
      {label}
    </span>
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
