import { ButtonLink } from "@/components/button";

const demoSteps = [
  "1. Nuova richiesta da WhatsApp o manuale",
  "2. Pianifica il sopralluogo",
  "3. Chiudi il lavoro e crea il preventivo",
  "4. Invia il preventivo e manda un promemoria",
  "5. Crea fattura, registra pagamento, chiedi recensione"
];

export function DemoPlaybookCard() {
  return (
    <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Demo 10 minuti</p>
      <h3 className="mt-2 text-lg font-semibold text-ink">Il flusso da far vedere a un handyman vero.</h3>
      <div className="mt-4 space-y-2">
        {demoSteps.map((step) => (
          <div key={step} className="rounded-xl bg-white px-3 py-2 text-sm text-neutral-700">
            {step}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/whatsapp" className="w-full sm:w-auto">
          Inizia dalla richiesta
        </ButtonLink>
        <ButtonLink href="/jobs" variant="secondary" className="w-full sm:w-auto">
          Apri i lavori demo
        </ButtonLink>
      </div>
    </div>
  );
}
