import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";

const ownerSections = [
  { href: "/whatsapp", label: "WhatsApp", description: "Thread, lead e proposte sopralluogo." },
  { href: "/customers", label: "Clienti", description: "Rubrica e schede cliente." },
  { href: "/estimates", label: "Preventivi", description: "Bozze, invii e promemoria." },
  { href: "/invoices", label: "Fatture", description: "Incassi, reminder e review." },
  { href: "/automations", label: "Automazioni", description: "Esecuzioni, code e ultime automazioni." },
  { href: "/activity", label: "Attivita", description: "Timeline unificata degli eventi." },
  { href: "/settings/team", label: "Team", description: "Costo orario di owner e worker." },
  { href: "/settings/company", label: "Impostazioni", description: "Dati azienda e configurazione." }
];

export default function MorePage() {
  return (
    <AppShell pathname="/more">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Altro"
          title="Tutte le sezioni secondarie in un solo posto."
          description="Su telefono qui trovi i moduli che non stanno nella navigazione principale."
        />

        <SectionCard title="Sezioni" subtitle="Apri il modulo giusto senza tornare indietro nella navigazione.">
          <div className="grid gap-3">
            {ownerSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-primary-200 hover:bg-primary-50"
              >
                <p className="text-base font-semibold text-ink">{section.label}</p>
                <p className="mt-1 text-sm text-neutral-600">{section.description}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
