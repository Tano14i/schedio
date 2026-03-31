import Link from "next/link";

export const dynamic = "force-dynamic";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials:
    "Credenziali non valide. Usa uno degli account demo sotto con password demo1234.",
  google_not_configured:
    "Google access non configurato. Aggiungi GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nelle variabili ambiente.",
  google_auth_failed:
    "Accesso con Google non riuscito. Riprova tra un attimo.",
  missing_email:
    "Google non ha restituito un indirizzo email verificato per questo account.",
  account_conflict:
    "Esiste gia un account con questa email collegato a un altro profilo Google."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const next = resolvedSearchParams.next ?? "/";
  const errorMessage = resolvedSearchParams.error
    ? LOGIN_ERROR_MESSAGES[resolvedSearchParams.error] || LOGIN_ERROR_MESSAGES.google_auth_failed
    : null;
  const googleUrl = `/api/auth/google/start?next=${encodeURIComponent(next)}`;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-panel lg:grid-cols-[1fr_420px]">
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-10 text-white">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-brand-200">
            Schedio
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
            Meno richieste perse. Preventivi piu veloci. Margine piu chiaro.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200">
            Schedio ti aiuta a prendere una richiesta, fissare il sopralluogo, inviare il preventivo,
            seguire il cliente e capire se il lavoro sta davvero lasciando margine.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              "Richiesta -> sopralluogo senza confusione",
              "Preventivo pronto in pochi minuti, non in giorni",
              "Ore, manodopera e margine visibili lavoro per lavoro"
            ].map((line) => (
              <div key={line} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <p className="text-sm font-medium text-primary-600">Accesso</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Accedi</h2>
          <p className="mt-2 text-sm text-slate-500">
            Entra con Google oppure usa gli account demo con ruoli base owner e worker.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {errorMessage}
            </div>
          ) : null}

          <Link
            href={googleUrl}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-ink transition hover:border-brand-300 hover:bg-slate-50"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-[11px] font-semibold">
              G
            </span>
            Continua con Google
          </Link>

          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            oppure
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div>
              <p className="font-medium text-ink">Owner demo</p>
              <p>luca@schedio.it - password demo1234</p>
            </div>
            <div>
              <p className="font-medium text-ink">Worker demo</p>
              <p>sara@schedio.it - password demo1234</p>
            </div>
          </div>

          <form action="/api/auth/demo" method="post" className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Email</span>
              <input
                name="email"
                type="email"
                defaultValue="luca@schedio.it"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-brand-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Password</span>
              <input
                name="password"
                type="password"
                defaultValue="demo1234"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-brand-400"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white"
            >
              Accedi alla demo
            </button>
          </form>

          <Link href="#" className="mt-4 inline-flex text-sm text-slate-500">
            Recupera password
          </Link>
        </div>
      </div>
    </div>
  );
}
