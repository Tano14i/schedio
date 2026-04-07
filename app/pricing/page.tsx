"use client";

import { ArrowRight, Check, ChevronDown, MessageSquareText, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────

const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Per chi inizia",
    monthly: 19,
    annual: 16,
    highlight: false,
    badge: null,
    features: [
      { text: "Fino a 50 clienti", included: true },
      { text: "Fino a 10 preventivi/mese", included: true },
      { text: "Fatture e pagamenti", included: true },
      { text: "Calendario appuntamenti", included: true },
      { text: "Supporto email", included: true },
      { text: "WhatsApp Business AI", included: false },
      { text: "AI assist per stime", included: false },
      { text: "Promemoria automatici", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Per l'artigiano attivo",
    monthly: 39,
    annual: 33,
    highlight: true,
    badge: "Più scelto",
    features: [
      { text: "Clienti illimitati", included: true },
      { text: "Preventivi illimitati", included: true },
      { text: "Fatture e pagamenti", included: true },
      { text: "Calendario appuntamenti", included: true },
      { text: "Supporto prioritario", included: true },
      { text: "WhatsApp Business AI", included: true },
      { text: "AI assist per stime", included: true },
      { text: "Promemoria automatici", included: true },
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "Per piccole squadre",
    monthly: 69,
    annual: 58,
    highlight: false,
    badge: null,
    features: [
      { text: "Tutto di Pro incluso", included: true },
      { text: "Fino a 5 utenti", included: true },
      { text: "Ruoli Owner / Worker", included: true },
      { text: "Report di squadra", included: true },
      { text: "Supporto dedicato", included: true },
    ],
  },
] as const;

const faqs = [
  {
    q: "Devo inserire la carta di credito per il periodo di prova?",
    a: "No. Puoi provare Schedio per 14 giorni senza inserire nessun dato di pagamento. La carta ti viene chiesta solo quando decidi di attivare un piano.",
  },
  {
    q: "Posso disdire quando voglio?",
    a: "Sì, in qualsiasi momento e senza penali. Se disdici durante il periodo di fatturazione, il tuo account rimane attivo fino alla scadenza naturale.",
  },
  {
    q: "Cosa succede dopo i 14 giorni di prova?",
    a: "Puoi scegliere un piano e continuare a lavorare. Se non lo fai, il tuo account viene sospeso ma i dati restano al sicuro per 30 giorni: rientri in qualsiasi momento senza perdere nulla.",
  },
  {
    q: "WhatsApp Business API è inclusa nel piano?",
    a: "L'integrazione è inclusa nei piani Pro e Team. Per usarla ti serve un numero WhatsApp Business verificato da Meta — ti guidiamo noi nel setup durante la configurazione iniziale.",
  },
  {
    q: "Posso cambiare piano in un secondo momento?",
    a: "Sì, puoi passare a un piano superiore o inferiore in qualsiasi momento. Il cambio è immediato e il credito del piano precedente viene scalato proporzionalmente.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F4F1EC] text-ink">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200/70 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-ink">Schedio</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#funzionalita" className="text-sm font-medium text-neutral-500 transition hover:text-ink">
              Funzionalità
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-ink underline decoration-amber-400 underline-offset-4">
              Prezzi
            </Link>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Inizia gratis
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-700">
            <MessageSquareText className="h-3.5 w-3.5" />
            14 giorni gratis — nessuna carta richiesta
          </div>
          <h1 className="mt-6 text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-[#081A2C] sm:text-5xl">
            Prezzi chiari,
            <br className="hidden sm:block" />
            {" "}senza sorprese
          </h1>
          <p className="mt-4 text-[1.05rem] leading-7 text-neutral-600">
            Scegli il piano giusto per la tua attività. Cambi idea? Cambi piano.
          </p>
        </div>

        {/* ── Toggle mensile / annuale ───────────────────────────────────── */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-ink" : "text-neutral-400"}`}>
            Mensile
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={`relative h-7 w-14 rounded-full transition-colors ${annual ? "bg-amber-500" : "bg-neutral-200"}`}
            aria-label="Passa a fatturazione annuale"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                annual ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`flex items-center gap-2 text-sm font-medium transition-colors ${annual ? "text-ink" : "text-neutral-400"}`}>
            Annuale
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
              2 mesi gratis
            </span>
          </span>
        </div>

        {/* ── Piani ─────────────────────────────────────────────────────── */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            const yearlyTotal = plan.annual * 12;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl p-7 transition-shadow ${
                  plan.highlight
                    ? "border-2 border-amber-400 bg-white shadow-[0_20px_60px_rgba(240,112,39,0.15)]"
                    : "border border-neutral-200 bg-white shadow-sm hover:shadow-md"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-500 px-3.5 py-1 text-xs font-bold text-white shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                    {plan.tagline}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-[#081A2C]">{plan.name}</h2>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-[#081A2C]">{price}€</span>
                    <span className="mb-1 text-sm text-neutral-400">/mese</span>
                  </div>
                  {annual && (
                    <p className="mt-1 text-xs text-neutral-500">
                      fatturato {yearlyTotal}€/anno
                    </p>
                  )}
                </div>

                <Link
                  href="/login"
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "border border-neutral-200 bg-neutral-50 text-ink hover:border-amber-300 hover:bg-amber-50"
                  }`}
                >
                  Inizia gratis — 14 giorni
                </Link>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5">
                      {f.included ? (
                        <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 flex-shrink-0 text-neutral-300" />
                      )}
                      <span className={`text-sm ${f.included ? "text-neutral-700" : "text-neutral-400"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── CTA secondaria ─────────────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <p className="text-sm text-neutral-500">
            Non sei sicuro del piano giusto?{" "}
            <a
              href="mailto:ciao@schedio.it"
              className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-700"
            >
              Scrivici, ti aiutiamo noi →
            </a>
          </p>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-[#081A2C]">
            Domande frequenti
          </h2>
          <div className="mx-auto mt-8 max-w-2xl divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-ink">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-neutral-400 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-6 pb-5 text-sm leading-7 text-neutral-600">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer CTA ─────────────────────────────────────────────────── */}
        <div className="mt-20 rounded-[36px] bg-[#081A2C] px-8 py-14 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">
            Inizia oggi
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            14 giorni gratis.
            <br />
            Nessuna carta richiesta.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/70">
            Prova Schedio senza impegno. Imposti tutto in meno di 10 minuti.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            Inizia gratis — 14 giorni
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
