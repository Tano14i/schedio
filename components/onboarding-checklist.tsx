import { ButtonLink } from "@/components/button";

const checklistItems = [
  {
    title: "Collega le richieste",
    description: "Fai entrare una richiesta da WhatsApp o creane una manuale.",
    href: "/whatsapp",
    cta: "Apri WhatsApp"
  },
  {
    title: "Chiudi un sopralluogo",
    description: "Completa un job e genera la bozza preventivo senza pagina vuota.",
    href: "/jobs",
    cta: "Apri lavori"
  },
  {
    title: "Imposta il team",
    description: "Aggiungi il costo orario dei tecnici per vedere il margine reale.",
    href: "/settings/team",
    cta: "Apri team"
  },
  {
    title: "Segui cosa si blocca",
    description: "Controlla preventivi da seguire, fatture aperte e lavori a rischio.",
    href: "/",
    cta: "Apri dashboard"
  }
];

export function OnboardingChecklist() {
  return (
    <div className="grid gap-3">
      {checklistItems.map((item, index) => (
        <div key={item.title} className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
              <ButtonLink href={item.href} variant="secondary" size="md" className="mt-3 w-full sm:w-auto">
                {item.cta}
              </ButtonLink>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
