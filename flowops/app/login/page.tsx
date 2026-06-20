import { LoginTabs } from "@/components/login-tabs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;
  const googleUrl = `/api/auth/google/start?next=${encodeURIComponent(next)}`;

  const ERROR_MESSAGES: Record<string, string> = {
    google_not_configured:
      "Google access non configurato. Aggiungi GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nelle variabili ambiente.",
    google_auth_failed: "Accesso con Google non riuscito. Riprova tra un attimo.",
    missing_email:
      "Google non ha restituito un indirizzo email verificato per questo account.",
    account_conflict:
      "Esiste già un account con questa email collegato a un altro profilo Google.",
  };

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.google_auth_failed) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F1EC] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-panel lg:grid-cols-[1fr_440px]">

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-10 text-white">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-brand-200">
            Schedio
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
            Il tuo spazio di lavoro da artigiano.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200">
            Richieste, sopralluoghi, preventivi, fatture e margine del team in un solo posto.
            Prova gratis per 14 giorni — nessuna carta richiesta.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              "Da richiesta WhatsApp a preventivo in pochi minuti",
              "Tieni traccia di ore, costi e margine per ogni lavoro",
              "Invita il team — ruoli Owner e Worker separati",
            ].map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                {line}
              </div>
            ))}
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center text-sm font-medium text-brand-100 underline-offset-4 hover:underline"
          >
            ← Torna alla home
          </Link>
        </div>

        {/* ── Right panel ───────────────────────────────────────────────── */}
        <div className="p-8 lg:p-10">
          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {errorMessage}
            </div>
          )}
          <LoginTabs googleUrl={googleUrl} next={next} />
        </div>

      </div>
    </div>
  );
}
