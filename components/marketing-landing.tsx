import {
  ArrowRight,
  BadgeEuro,
  CalendarDays,
  Clock3,
  FileText,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { ButtonLink } from "@/components/button";

const outcomes = [
  "Richiesta -> sopralluogo senza rincorrere nessuno",
  "Preventivo pronto in pochi minuti, non in giorni",
  "Ore, costi e margine visibili prima di confermare"
];

const processSteps = [
  {
    title: "Richiesta WhatsApp",
    description: "Messaggi, foto e cliente entrano nello stesso flusso invece di restare sparsi.",
    icon: MessageSquareText
  },
  {
    title: "Sopralluogo in agenda",
    description: "La richiesta diventa appuntamento, il tecnico vede il lavoro e l'owner non perde il filo.",
    icon: CalendarDays
  },
  {
    title: "Preventivo con contesto",
    description: "Parti da una bozza gia precompilata con note, foto e riepilogo del sopralluogo.",
    icon: FileText
  },
  {
    title: "Fattura e margine",
    description: "Segui il cliente, incassi e controlli se il lavoro sta lasciando margine davvero.",
    icon: BadgeEuro
  }
];

const painPoints = [
  "Richieste disperse tra WhatsApp, chiamate e memoria",
  "Preventivi che partono tardi anche quando il lavoro e gia chiaro",
  "Follow-up e incassi che restano indietro mentre sei gia sul prossimo lavoro",
  "Lavori che sembrano buoni ma consumano ore e margine senza fartelo vedere in tempo"
];

const appointments = [
  { time: "08:30", title: "Sopralluogo perdita bagno", customer: "Mario Rossi", status: "Confermato" },
  { time: "11:00", title: "Riparazione tapparella", customer: "Giulia Neri", status: "In attesa cliente" },
  { time: "15:30", title: "Preventivo infissi", customer: "Laura Bianchi", status: "Da inviare oggi" }
];

const estimateItems = [
  { label: "Intervento serramento", qty: "1", amount: "420 €" },
  { label: "Materiali e ferramenta", qty: "1", amount: "85 €" },
  { label: "Manodopera stimata", qty: "3h", amount: "150 €" }
];

export function MarketingLanding() {
  return (
    <div className="min-h-screen bg-[#eef3f7] text-ink">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_16px_40px_rgba(19,42,56,0.06)] sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-600">
                Schedio
              </p>
              <p className="max-w-2xl text-sm leading-6 text-neutral-600">
                Software operativo per idraulici, elettricisti, serramentisti e piccole squadre che
                vogliono perdere meno richieste e capire prima se il lavoro conviene davvero.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink href="/login" variant="secondary" size="md" className="w-full sm:w-auto">
                Accedi
              </ButtonLink>
              <ButtonLink href="/login" size="md" className="w-full sm:w-auto">
                Guarda la demo guidata
              </ButtonLink>
            </div>
          </div>
        </header>

        <main className="space-y-10 py-8 sm:py-10">
          <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
            <div className="rounded-[36px] border border-slate-200/90 bg-[#132a38] p-6 text-white shadow-[0_22px_60px_rgba(19,42,56,0.22)] sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-primary-50">
                <ShieldCheck className="h-4 w-4" />
                Più velocità commerciale. Meno lavori sbagliati.
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-100">
                Richieste perse, preventivi lenti, margine incerto
              </p>
              <h1 className="mt-3 max-w-3xl text-[2.6rem] font-semibold leading-[0.95] sm:text-[3.5rem]">
                Meno richieste perse. Preventivi più veloci. Meno lavori in perdita.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-primary-50/90 sm:text-lg">
                Da richiesta WhatsApp a sopralluogo, preventivo, fattura e follow-up senza perdere
                pezzi per strada e con il margine sotto controllo prima di accettare il lavoro.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {outcomes.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm leading-6 text-primary-50"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/login" className="w-full sm:w-auto">
                  Guarda come una richiesta WhatsApp diventa preventivo
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                  Vedi il flusso completo in 3 minuti
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-[36px] border border-slate-200/90 bg-white p-5 shadow-[0_18px_50px_rgba(19,42,56,0.08)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-600">
                    Dentro la demo
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                    Vedi il prodotto lavorare, non solo una promessa.
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Agenda di oggi</p>
                      <p className="mt-1 text-sm text-neutral-600">Richieste e sopralluoghi nella stessa giornata.</p>
                    </div>
                    <CalendarDays className="h-5 w-5 text-primary-700" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {appointments.map((appointment) => (
                      <div key={`${appointment.time}-${appointment.title}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{appointment.title}</p>
                            <p className="mt-1 text-sm text-neutral-600">
                              {appointment.customer} · ore {appointment.time}
                            </p>
                          </div>
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Preventivo già impostato</p>
                      <p className="mt-1 text-sm text-neutral-600">Non parti da una pagina vuota.</p>
                    </div>
                    <FileText className="h-5 w-5 text-primary-700" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {estimateItems.map((item) => (
                      <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_70px_90px] gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                        <p className="font-medium text-ink">{item.label}</p>
                        <p className="text-neutral-600">{item.qty}</p>
                        <p className="text-right font-medium text-ink">{item.amount}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetricMini label="Totale" value="655 €" />
                    <MetricMini label="Costo" value="410 €" />
                    <MetricMini label="Margine" value="245 €" accent="ok" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[32px] border border-danger-200 bg-danger-50 p-6 shadow-[0_14px_40px_rgba(142,58,58,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-danger-700">
                Il problema vero
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                Stai perdendo soldi e spesso te ne accorgi tardi.
              </h3>
              <div className="mt-5 space-y-3">
                {painPoints.map((item) => (
                  <div key={item} className="rounded-2xl border border-danger-100 bg-white px-4 py-3 text-sm leading-6 text-neutral-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <OutcomeCard
                eyebrow="Prima"
                title="Richieste sparse e decisioni prese a memoria"
                description="La giornata si spezza tra chat, richiamate e preventivi che restano aperti troppo a lungo."
              />
              <OutcomeCard
                eyebrow="Dopo"
                title="Sai cosa fare oggi e cosa ti lascia margine"
                description="Il lavoro entra, prende forma e resta leggibile da richiesta a incasso."
              />
              <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-[0_12px_36px_rgba(19,42,56,0.06)] md:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-600">
                  Perché funziona
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-ink">
                  Schedio non ti chiede di ricordarti tutto. Ti mostra il prossimo passo utile e il conto del lavoro prima che sia tardi.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-600">
                Come si muove il lavoro
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                Un solo flusso invece di cinque strumenti separati.
              </h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {processSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-[0_12px_36px_rgba(19,42,56,0.06)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-lg font-semibold tracking-tight text-ink">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[36px] border border-slate-200/90 bg-white p-6 shadow-[0_18px_46px_rgba(19,42,56,0.07)] sm:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-600">
                  Offerta
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                  Guarda il flusso completo: richiesta, sopralluogo, preventivo, fattura e margine.
                </h3>
                <p className="mt-3 text-base leading-7 text-neutral-600">
                  In pochi minuti vedi se Schedio ti aiuta davvero a perdere meno richieste, mandare prima il preventivo e capire se il lavoro sta in piedi.
                </p>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-ink">Dentro la demo guidata vedi:</p>
                <div className="mt-4 space-y-3">
                  {[
                    "una richiesta WhatsApp che entra e diventa lead",
                    "un sopralluogo che va in agenda senza rincorse",
                    "un preventivo già impostato con margine visibile",
                    "fattura, follow-up e incasso nello stesso flusso"
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                      <p className="text-sm leading-6 text-neutral-700">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/login" className="w-full">
                    Prova demo gratuita
                  </ButtonLink>
                  <ButtonLink href="/login" variant="secondary" className="w-full">
                    Entra nella demo
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function MetricMini({
  label,
  value,
  accent = "default"
}: {
  label: string;
  value: string;
  accent?: "default" | "ok";
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${accent === "ok" ? "border-success-200 bg-success-50" : "border-slate-200 bg-white"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function OutcomeCard({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white p-6 shadow-[0_12px_36px_rgba(19,42,56,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-600">{eyebrow}</p>
      <p className="mt-3 text-xl font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}
