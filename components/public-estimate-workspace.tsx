"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/button";
import type { Customer, Estimate } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function PublicEstimateWorkspace({
  companyName,
  initialCustomer,
  initialEstimate
}: {
  companyName: string;
  initialCustomer?: Customer;
  initialEstimate: Estimate;
}) {
  const [estimate, setEstimate] = useState(initialEstimate);
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(
    initialEstimate.status === "accepted"
      ? "accepted"
      : initialEstimate.status === "rejected"
        ? "rejected"
        : null
  );
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch(`/api/public/estimates/${initialEstimate.publicToken}/viewed`, {
      method: "POST"
    }).catch(() => undefined);
  }, [initialEstimate.publicToken]);

  function handleDecision(nextDecision: "accepted" | "rejected") {
    setFeedback("");
    startTransition(async () => {
      const response = await fetch(`/api/public/estimates/${estimate.publicToken}/${nextDecision}`, {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        setFeedback(result?.message ?? "Qualcosa non ha funzionato, riprova.");
        return;
      }

      setEstimate({
        ...estimate,
        status: result.item.status.toLowerCase(),
        acceptedAt: result.item.acceptedAt ?? estimate.acceptedAt,
        rejectedAt: result.item.rejectedAt ?? estimate.rejectedAt
      });
      setDecision(nextDecision);
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-neutral-200 bg-white p-8 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">{companyName}</p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">
          {estimate.title || `Preventivo per ${initialCustomer?.fullName ?? "cliente"}`}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {estimate.introText ?? "Grazie per aver richiesto un preventivo. Qui puoi vedere i dettagli e confermare."}
        </p>

        {estimate.scopeSummary ? (
          <div className="mt-6 rounded-2xl bg-neutral-50 p-5">
            <p className="text-sm font-medium text-ink">Riepilogo</p>
            <p className="mt-2 text-sm text-neutral-600">{estimate.scopeSummary}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3">
          {estimate.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-4">
              <div>
                <p className="font-medium text-ink">{item.label}</p>
                {item.description ? <p className="mt-1 text-sm text-neutral-500">{item.description}</p> : null}
                <p className="mt-1 text-sm text-neutral-500">
                  {item.qty} x {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-ink">{formatCurrency(item.qty * item.unitPrice)}</p>
            </div>
          ))}
        </div>

        {estimate.notes ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-sm font-medium text-ink">Note</p>
            <p className="mt-2 text-sm text-neutral-600 whitespace-pre-line">{estimate.notes}</p>
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl bg-primary-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-100">Totale</span>
            <span className="text-3xl font-semibold">{formatCurrency(estimate.total)}</span>
          </div>
          {estimate.validUntil ? (
            <p className="mt-3 text-sm text-primary-100">Valido fino al {new Date(estimate.validUntil).toLocaleDateString("it-IT")}</p>
          ) : null}
          {estimate.terms ? <p className="mt-2 text-sm text-primary-100">{estimate.terms}</p> : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button disabled={isPending} type="button" onClick={() => handleDecision("accepted")}>
              Accetta preventivo
            </Button>
            <Button
              disabled={isPending}
              type="button"
              variant="secondary"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => handleDecision("rejected")}
            >
              Rifiuta
            </Button>
          </div>

          {decision ? (
            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-medium">
                {decision === "accepted" ? "Preventivo accettato" : "Preventivo rifiutato"}
              </p>
              <p className="mt-1 text-sm text-primary-100">
                {decision === "accepted"
                  ? "Perfetto. Ti contatteremo per confermare il prossimo passo."
                  : "Ricevuto. Se vuoi possiamo preparare una nuova proposta."}
              </p>
            </div>
          ) : null}
          {feedback ? <p className="mt-4 text-sm text-primary-100">{feedback}</p> : null}
        </div>
      </div>
    </div>
  );
}
