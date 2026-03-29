"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import type { Customer, Invoice } from "@/lib/types";
import { formatCompactDate, formatCurrency } from "@/lib/utils";

export function PublicInvoiceWorkspace({
  companyName,
  initialCustomer,
  initialInvoice
}: {
  companyName: string;
  initialCustomer?: Customer;
  initialInvoice: Invoice;
}) {
  const [viewed, setViewed] = useState(Boolean(initialInvoice.viewedAt));

  useEffect(() => {
    if (viewed) {
      return;
    }

    fetch(`/api/public/invoices/${initialInvoice.publicToken}/viewed`, {
      method: "POST"
    }).then(() => setViewed(true)).catch(() => undefined);
  }, [initialInvoice.publicToken, viewed]);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-white p-8 shadow-panel">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">{companyName}</p>
            <h1 className="mt-3 text-4xl font-semibold text-ink">Fattura {initialInvoice.number}</h1>
            <p className="mt-2 text-sm text-neutral-600">
              {initialCustomer?.fullName ?? "Cliente"} · Scadenza{" "}
              {initialInvoice.dueDate ? formatCompactDate(initialInvoice.dueDate) : "non definita"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={initialInvoice.status} />
            {viewed ? (
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                Visualizzata
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Riepilogo</p>
              <p className="mt-3 text-sm text-neutral-700">{initialInvoice.title ?? "Fattura lavoro completato"}</p>
              {initialInvoice.notes ? <p className="mt-2 text-sm text-neutral-600">{initialInvoice.notes}</p> : null}
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Voci fattura</p>
              <div className="mt-4 space-y-3">
                {(initialInvoice.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-ink">{item.label}</p>
                      {item.description ? <p className="mt-1 text-sm text-neutral-500">{item.description}</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-500">{item.qty} x {formatCurrency(item.unitPrice)}</p>
                      <p className="mt-1 font-medium text-ink">{formatCurrency(item.qty * item.unitPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Totale</p>
            <p className="mt-3 text-3xl font-semibold text-ink">{formatCurrency(initialInvoice.total)}</p>
            <div className="mt-5 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between">
                <span>Scadenza</span>
                <span>{initialInvoice.dueDate ? formatCompactDate(initialInvoice.dueDate) : "Da definire"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stato</span>
                <span className="font-medium text-ink">{statusLabel(initialInvoice.status)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Termini</span>
                <span className="max-w-[180px] text-right">{initialInvoice.terms ?? "Pagamento a fine lavoro."}</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-medium text-primary-700">Pagamento gestito dal professionista</p>
              <p className="mt-1 text-sm text-primary-700">
                Per questo MVP la fattura si visualizza online e il pagamento viene registrato direttamente da Schedio.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: Invoice["status"]) {
  const labels: Record<Invoice["status"], string> = {
    draft: "Bozza",
    sent: "Inviata",
    paid: "Pagata",
    overdue: "Scaduta",
    void: "Annullata"
  };

  return labels[status];
}
