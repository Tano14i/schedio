"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompanyFieldForm({
  field,
  label,
  currentValue,
  placeholder,
  type = "text",
  hint
}: {
  field: "trade" | "email" | "reviewUrl";
  label: string;
  currentValue: string | null;
  placeholder?: string;
  type?: "text" | "email" | "url";
  hint?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Errore nel salvataggio.");
        return;
      }
      router.refresh();
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor={field} className="mb-1.5 block text-xs font-medium text-neutral-500 uppercase tracking-wide">
          {label}
        </label>
        <input
          id={field}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
        {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50 sm:mb-0"
      >
        {saving ? "Salvo..." : "Salva"}
      </button>
    </div>
  );
}
