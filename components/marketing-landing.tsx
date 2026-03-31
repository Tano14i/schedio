import {
  ArrowRight,
  BadgeEuro,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Receipt,
  TimerReset
} from "lucide-react";
import { ButtonLink } from "@/components/button";

const outcomeCards = [
  "Richiesta -> sopralluogo senza inseguire nessuno",
  "Preventivo pronto in pochi minuti, non in giorni",
  "Sai subito ore, costi e margine prima di confermare"
];

const flowSteps = [
  {
    title: "1. La richiesta entra da WhatsApp",
    description: "Messaggi, foto e contatto finiscono in un unico punto invece di restare sparsi tra chat e memoria.",
    icon: MessageSquareText
  },
  {
    title: "2. Pianifichi il sopralluogo",
    description: "La richiesta diventa appuntamento, il tecnico vede il lavoro e nessuno deve rincorrere nessuno.",
    icon: CalendarDays
  },
  {
    title: "3. Chiudi e mandi il preventivo",
    description: "Dopo il sopralluogo trovi gia note, foto e struttura del preventivo. Parti da una bozza, non da zero.",
    icon: FileText
  },
  {
    title: "4. Segui, fatturi, incassi",
    description: "Schedio ti ricorda cosa seguire, ti aiuta a fatturare e ti lascia visibile il margine del lavoro.",
    icon: Receipt
  }
];

const proofCards = [
  {
    title: "Prima",
    description: "Richieste perse, preventivi rimandati, clienti da richiamare a memoria."
  },
  {
    title: "Dopo",
    description: "Sai cosa fare oggi, mandi il preventivo prima e vedi se il lavoro sta davvero lasciando margine."
  }
];

const painPoints = [
  "Richieste disperse tra WhatsApp, chiamate e memoria",
  "Preventivi che partono dopo giorni invece che subito",
  "Lavori che sembrano buoni ma poi mangiano ore e margine",
  "Follow-up, fatture e pagamenti che restano indietro"
];

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-neutral-50 text-ink">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-neutral-200 bg-white px-5 py-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">Schedio</p>
            <h1 className="mt-2 text-lg font-semibold text-ink sm:text-xl">
              Meno richieste perse. Preventivi piu veloci. Sai prima se il lavoro ti lascia margine.
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink href="/login" variant="secondary" size="md" className="w-full sm:w-auto">
              Accedi
            </ButtonLink>
            <ButtonLink href="/login" size="md" className="w-full sm:w-auto">
              Guarda la demo in 3 minuti
            </ButtonLink>
          </div>
        </header>

        <main className="space-y-8 py-8 sm:space-y-10 sm:py-10">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                <CheckCircle2 className="h-4 w-4" />
                Per idraulici, elettricisti, serramentisti e piccole squadre che lavorano gia troppo di testa
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">
                  Richieste disperse, preventivi lenti, lavori con margine incerto
                </p>
                <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.02] text-ink sm:text-5xl">
                  Sai subito se il preventivo ti fa guadagnare davvero.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
                  Da richiesta WhatsApp a sopralluogo, preventivo e follow-up senza perdere pezzi per strada
                  e con il margine sotto controllo prima di accettare il lavoro.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {outcomeCards.map((item) => (
                  <div key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
                    <p className="text-sm font-medium text-ink">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/login" className="w-full sm:w-auto">
                  Guarda come una richiesta WhatsApp diventa preventivo
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" className="w-full sm:w-auto">
                  Vedi il flusso completo in 3 minuti
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-[32px] border border-primary-200 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 p-5 text-white shadow-panel sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-100">
                Cosa senti subito
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <LandingMetric
                  icon={Clock3}
                  label="Preventivo"
                  value="pochi minuti"
                  detail="non giorni di ritardo"
                />
                <LandingMetric
                  icon={TimerReset}
                  label="Follow-up"
                  value="sempre visibile"
                  detail="nessun cliente lasciato li"
                />
                <LandingMetric
                  icon={BadgeEuro}
                  label="Margine"
                  value="subito chiaro"
                  detail="ore, costi e ricavo atteso"
                />
                <LandingMetric
                  icon={Receipt}
                  label="Incasso"
                  value="piu ordinato"
                  detail="fatture e pagamenti sotto controllo"
                />
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-semibold text-white">Demo pratica</p>
                <p className="mt-2 text-sm leading-6 text-primary-50">
                  In meno di 10 minuti vedi una richiesta entrare, diventare sopralluogo, trasformarsi in preventivo e arrivare fino a fattura e margine.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-danger-200 bg-danger-50 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-danger-700">Il problema</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">Stai perdendo soldi e spesso te ne accorgi tardi.</h3>
              <div className="mt-4 space-y-3">
                {painPoints.map((item) => (
                  <div key={item} className="rounded-2xl border border-danger-100 bg-white px-4 py-3 text-sm text-neutral-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {proofCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">{card.title}</p>
                  <p className="mt-3 text-lg font-semibold text-ink">{card.description}</p>
                </div>
              ))}
              <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-soft sm:col-span-2 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">Perche funziona</p>
                <p className="mt-3 text-lg font-semibold text-ink">
                  Schedio non ti chiede di ricordarti tutto. Ti mostra cosa fare adesso, cosa sta rallentando i lavori e se il conto sta tornando prima di scoprilo troppo tardi.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">Come funziona</p>
              <h3 className="mt-3 text-3xl font-semibold text-ink">Da richiesta a lavoro chiuso senza cambiare 5 strumenti.</h3>
              <p className="mt-3 text-base leading-7 text-neutral-600">
                Il valore non e avere piu schermate. Il valore e togliere buchi tra un passaggio e l'altro.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {flowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-ink">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[32px] border border-primary-200 bg-white p-6 shadow-panel sm:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600">Offerta</p>
                <h3 className="mt-3 text-3xl font-semibold text-ink">
                  Guarda il flusso completo: richiesta, preventivo, fattura e margine in pochi minuti.
                </h3>
                <p className="mt-3 text-base leading-7 text-neutral-600">
                  Se ti occupi di richieste, sopralluoghi, preventivi e clienti senza una persona dedicata all'ufficio, questa e la parte che senti subito.
                </p>
              </div>
              <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
                <p className="text-sm font-semibold text-ink">Dentro la demo vedi:</p>
                <div className="mt-4 space-y-3">
                  {[
                    "una richiesta WhatsApp che entra e si trasforma in lead",
                    "un sopralluogo che diventa preventivo senza pagina vuota",
                    "follow-up, fattura e margine nello stesso flusso"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                      <p className="text-sm text-neutral-700">{item}</p>
                    </div>
                  ))}
                </div>
                <ButtonLink href="/login" className="mt-5 w-full">
                  Vedi la demo guidata
                </ButtonLink>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function LandingMetric({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <Icon className="h-5 w-5 text-white" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary-100">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <p className="text-sm text-primary-100">{detail}</p>
    </div>
  );
}
