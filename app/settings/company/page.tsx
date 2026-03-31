import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { WhatsAppSetupCard } from "@/components/whatsapp-setup-card";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppConnectionStatus } from "@/lib/whatsapp-config";

export default async function CompanySetupPage() {
  try {
    const session = await getCurrentSession();
    const company = session?.user.company ?? await prisma.company.findFirstOrThrow({
      orderBy: { createdAt: "asc" }
    });
    const connection = getWhatsAppConnectionStatus();

    return (
      <AppShell pathname="/settings/company">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Company setup"
            title="Configurazione azienda"
            description="Setup iniziale leggero: nome attivita, contatti, indirizzo e impostazioni base del brand commerciale."
          />

          <SectionCard title="Profilo azienda" subtitle="Base pronta per logo, termini documento e canali automazioni.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome azienda" value={company.name} />
              <Field label="Email" value={company.email ?? undefined} />
              <Field label="Telefono" value={company.phone ?? undefined} />
              <Field label="Indirizzo" value={company.address ?? undefined} />
            </div>
          </SectionCard>

          <SectionCard title="Team e costi orari" subtitle="Imposta il costo orario dei tecnici per calcolare davvero la marginalita dei lavori.">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neutral-600">
                Da qui passi alla schermata team, dove aggiorni il costo orario di owner e worker.
              </p>
              <ButtonLink href="/settings/team" className="w-full sm:w-auto">
                Apri team
              </ButtonLink>
            </div>
          </SectionCard>

          <WhatsAppSetupCard connection={connection} />

          <SectionCard title="Setup iniziale consigliato" subtitle="Le 3 mosse che rendono Schedio subito piu utile.">
            <div className="grid gap-3 md:grid-cols-3">
              <SetupStep
                title="1. Team"
                description="Imposta il costo orario dei tecnici."
                href="/settings/team"
                cta="Vai al team"
              />
              <SetupStep
                title="2. WhatsApp"
                description="Completa webhook, token e invio test una volta sola."
                href="/settings/company#whatsapp"
                cta="Configura WhatsApp"
              />
              <SetupStep
                title="3. Demo"
                description="Chiudi un lavoro, invia un preventivo e controlla il margine."
                href="/"
                cta="Apri dashboard"
              />
            </div>
          </SectionCard>
        </div>
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/settings/company">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Company setup"
            title="Configurazione azienda"
            description="Setup iniziale leggero: nome attivita, contatti, indirizzo e impostazioni base del brand commerciale."
          />

          <SectionCard title="Profilo azienda">
            <p className="text-sm text-neutral-600">
              Impossibile caricare il profilo azienda dal database. Riprova tra poco.
            </p>
          </SectionCard>
        </div>
      </AppShell>
    );
  }
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value ?? "-"}</p>
    </div>
  );
}

function SetupStep({
  title,
  description,
  href,
  cta
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-neutral-600">{description}</p>
      <ButtonLink href={href} variant="secondary" className="mt-4 w-full">
        {cta}
      </ButtonLink>
    </div>
  );
}
