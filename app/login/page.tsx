import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const next = resolvedSearchParams.next ?? "/";
  const hasError = resolvedSearchParams.error === "invalid_credentials";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-panel lg:grid-cols-[1fr_420px]">
        <div className="bg-gradient-to-br from-brand-900 via-brand-800 to-ink p-10 text-white">
          <p className="font-display text-xs uppercase tracking-[0.28em] text-brand-200">
            Schedio
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">Schedio</h1>
          <p className="mt-4 max-w-xl text-base text-slate-200">
            Organizza richieste, appuntamenti, preventivi e follow-up in un solo posto.
          </p>
          <div className="mt-8 grid gap-3">
            {[
              "Massimo 3 click da richiesta a appuntamento",
              "Preventivo inviato in meno di 2 minuti",
              "Fattura e review request a chiusura lavoro"
            ].map((line) => (
              <div key={line} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <p className="text-sm font-medium text-primary-600">Demo access</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Accedi</h2>
          <p className="mt-2 text-sm text-slate-500">
            Accesso protetto con ruoli base. Usa un account owner o worker della demo.
          </p>

          {hasError ? (
            <div className="mt-4 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              Credenziali non valide. Usa uno degli account demo sotto con password{" "}
              <span className="font-medium">demo1234</span>.
            </div>
          ) : null}

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
