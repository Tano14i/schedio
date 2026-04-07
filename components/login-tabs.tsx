"use client";

import { useState } from "react";

type Tab = "login" | "register";

export function LoginTabs({
  googleUrl,
  next,
}: {
  googleUrl: string;
  next: string;
}) {
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Login ────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Errore durante l'accesso.");
        return;
      }
      window.location.href = next;
    } catch {
      setError("Errore di rete. Riprova tra un attimo.");
    } finally {
      setLoading(false);
    }
  }

  // ── Register ─────────────────────────────────────────────────────────────

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          trade: fd.get("trade"),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Errore durante la registrazione.");
        return;
      }
      window.location.href = next;
    } catch {
      setError("Errore di rete. Riprova tra un attimo.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const inputClass =
    "w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-brand-400";
  const labelClass = "mb-2 block text-sm font-medium text-ink";

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => { setTab("login"); setError(null); }}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            tab === "login"
              ? "bg-white text-ink shadow-sm"
              : "text-slate-500 hover:text-ink"
          }`}
        >
          Accedi
        </button>
        <button
          type="button"
          onClick={() => { setTab("register"); setError(null); }}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            tab === "register"
              ? "bg-white text-ink shadow-sm"
              : "text-slate-500 hover:text-ink"
          }`}
        >
          Registrati
        </button>
      </div>

      {/* Google OAuth */}
      <a
        href={googleUrl}
        className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition hover:border-brand-300 hover:bg-slate-50"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-[11px] font-semibold">
          G
        </span>
        Continua con Google
      </a>

      <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        oppure
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* ── Tab: Accedi ────────────────────────────────────────────────── */}
      {tab === "login" && (
        <>
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <label className="block">
              <span className={labelClass}>Email</span>
              <input name="email" type="email" required autoComplete="email" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Password</span>
              <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {loading ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>

          {/* Demo accounts hint */}
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-2 font-medium text-ink">Account demo</p>
            <p>luca@schedio.it — password demo1234</p>
            <p className="mt-1">sara@schedio.it — password demo1234</p>
          </div>
        </>
      )}

      {/* ── Tab: Registrati ────────────────────────────────────────────── */}
      {tab === "register" && (
        <form onSubmit={handleRegister} className="mt-5 space-y-4">
          <label className="block">
            <span className={labelClass}>Nome e cognome</span>
            <input name="name" type="text" required autoComplete="name" placeholder="Mario Rossi" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              placeholder="Minimo 8 caratteri"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>
              Mestiere{" "}
              <span className="font-normal text-slate-400">(facoltativo)</span>
            </span>
            <input
              name="trade"
              type="text"
              autoComplete="off"
              placeholder="es. Idraulico, Elettricista…"
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "Registrazione in corso…" : "Inizia gratis — 14 giorni"}
          </button>
          <p className="text-center text-xs text-slate-400">
            Nessuna carta richiesta. Cancelli quando vuoi.
          </p>
        </form>
      )}
    </div>
  );
}
