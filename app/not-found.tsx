import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg rounded-[32px] border border-white/70 bg-white p-8 text-center shadow-panel">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-brand-700">
          Schedio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Pagina non trovata</h1>
        <p className="mt-3 text-sm text-slate-600">
          Questo link non e disponibile oppure il token pubblico non esiste piu.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white"
        >
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
