import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/button";
import { ActivityTimeline } from "@/components/activity-timeline";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getActivityFeed, getActivityMessage, getCustomerDetailData } from "@/lib/crm-server";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const customer = await getCustomerDetailData(id);

    if (!customer) {
      notFound();
    }

    const entityIds = new Set([
      customer.id,
      ...customer.leads.map((item) => item.id),
      ...customer.jobs.map((item) => item.id),
      ...customer.estimates.map((item) => item.id),
      ...customer.invoices.map((item) => item.id)
    ]);
    const logs = await getActivityFeed();
    const customerActivity = logs
      .filter((item) => entityIds.has(item.entityId))
      .map((item) => ({
        id: item.id,
        entityType: item.entityType as "lead" | "job" | "estimate" | "invoice" | "customer" | "whatsapp",
        entityId: item.entityId,
        eventType: item.eventType,
        message: getActivityMessage(item),
        createdAt: item.createdAt.toISOString()
      }));

    return (
      <AppShell pathname="/customers">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Cliente"
            title={customer.fullName}
            description="Richieste, lavori, preventivi e fatture in un solo posto."
            action={{ href: "/leads?action=new", label: "Nuova richiesta" }}
          />

          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/leads?action=new" size="md">Nuova richiesta</ButtonLink>
            <ButtonLink href="/calendar" variant="secondary" size="md">Nuovo appuntamento</ButtonLink>
            <ButtonLink href="/estimates" variant="secondary" size="md">Nuovo preventivo</ButtonLink>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <SectionCard
              title="Panoramica"
              subtitle={`${customer.phone} - ${customer.email ?? "Email non inserita"} - ${customer.address ?? "Indirizzo non inserito"}`}
            >
              <p className="text-sm text-neutral-600">
                {customer.notes ?? "Nessuna nota interna salvata per questo cliente."}
              </p>
            </SectionCard>

            <SectionCard title="Attivita" subtitle="Timeline di richieste, reminder, preventivi e pagamenti.">
              <ActivityTimeline items={customerActivity} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard title="Lavori" subtitle="Stato, data e indirizzo.">
              <div className="space-y-3">
                {customer.jobs.length ? customer.jobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{job.title}</p>
                      <StatusBadge status={job.status.toLowerCase() as "scheduled" | "on_the_way" | "in_progress" | "completed" | "canceled"} />
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">{formatDateTime(job.startAt.toISOString())}</p>
                  </div>
                )) : (
                  <p className="text-sm text-neutral-600">Nessun lavoro collegato.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Preventivi" subtitle="Bozze, inviati e accettati.">
              <div className="space-y-3">
                {customer.estimates.length ? customer.estimates.map((estimate) => (
                  <div key={estimate.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{estimate.number}</p>
                      <StatusBadge status={estimate.status.toLowerCase() as "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired"} />
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">{formatCurrency(estimate.total)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-neutral-600">Nessun preventivo collegato.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Fatture" subtitle="Inviate, aperte e pagate.">
              <div className="space-y-3">
                {customer.invoices.length ? customer.invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{invoice.number}</p>
                      <StatusBadge status={invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "void"} />
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">{formatCurrency(invoice.total)}</p>
                  </div>
                )) : (
                  <p className="text-sm text-neutral-600">Nessuna fattura collegata.</p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/customers">
        <div className="space-y-6">
          <PageHeader
            eyebrow="Cliente"
            title="Cliente non disponibile"
            description="Impossibile caricare questa scheda cliente dal database."
            action={{ href: "/customers", label: "Torna ai clienti" }}
          />

          <SectionCard title="Dettagli cliente">
            <p className="text-sm text-neutral-600">
              Riprova tra poco oppure torna alla rubrica clienti per ripartire da una scheda valida.
            </p>
          </SectionCard>
        </div>
      </AppShell>
    );
  }
}
