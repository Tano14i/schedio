"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BillingData = {
  vatNumber: string | null;
  iban: string | null;
  defaultTaxRate: number;
  country: string;
  currency: string;
};

export function BillingEditForm({ current }: { current: BillingData }) {
  const router = useRouter();
  const [vatNumber, setVatNumber] = useState(current.vatNumber ?? "");
  const [iban, setIban] = useState(current.iban ?? "");
  const [defaultTaxRate, setDefaultTaxRate] = useState(
    String(Math.round(current.defaultTaxRate * 100))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    const rate = parseFloat(defaultTaxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Inserisci un'aliquota IVA valida (0–100).");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vatNumber: vatNumber.trim() || null,
          iban: iban.trim() || null,
          defaultTaxRate: rate / 100
        })
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Errore nel salvataggio.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            BTW-nummer (P.IVA)
          </label>
          <input
            type="text"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value)}
            placeholder="es. NL123456789B01"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            IBAN
          </label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="es. NL91ABNA0417164300"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="w-48">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
            Aliquota IVA default (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={defaultTaxRate}
              onChange={(e) => setDefaultTaxRate(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 pr-10 text-sm text-ink focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
              %
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            BTW standard NL: 21% · ridotta: 9%
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? "Salvo..." : "Salva"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-emerald-600">Salvato.</p>}
    </div>
  );
}
