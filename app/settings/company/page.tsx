import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CompanySetupPage() {
  try {
    const session = await getCurrentSession();
    const company = session?.user.company ?? await prisma.company.findFirstOrThrow({
      orderBy: { createdAt: "asc" }
    });

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
