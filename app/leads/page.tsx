import { AppShell } from "@/components/app-shell";
import { LeadsWorkspace } from "@/components/leads-workspace";
import { deriveLeadNextAction, getLeadsPageData } from "@/lib/crm-server";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  try {
    const { customers: dbCustomers, leads: dbLeads, jobs: dbJobs } = await getLeadsPageData();

    return (
      <AppShell pathname="/leads">
        <LeadsWorkspace
          initialCustomers={dbCustomers.map((customer) => ({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email ?? undefined,
            address: customer.address ?? undefined,
            notes: customer.notes ?? undefined,
            createdAt: customer.createdAt.toISOString()
          }))}
          initialLeads={dbLeads.map((lead) => ({
            id: lead.id,
            customerId: lead.customerId,
            source: lead.source.toLowerCase() as "manual" | "web_form" | "phone" | "whatsapp" | "referral",
            serviceType: lead.serviceType,
            description: lead.description,
            urgency: lead.urgency as "low" | "medium" | "high",
            preferredDate: lead.preferredDate?.toISOString(),
            status: lead.status.toLowerCase() as "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost",
            createdAt: lead.createdAt.toISOString(),
            nextAction: deriveLeadNextAction(lead)
          }))}
          initialJobLinks={dbJobs.reduce<Record<string, string>>((acc, job) => {
            if (job.leadId) {
              acc[job.leadId] = `/jobs/${job.id}`;
            }
            return acc;
          }, {})}
          initialOpen={resolvedSearchParams.action === "new"}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/leads">
        <div className="space-y-6">
          <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
            Impossibile caricare richieste e clienti dal database. Riprova tra poco.
          </div>
          <LeadsWorkspace
            initialCustomers={[]}
            initialLeads={[]}
            initialJobLinks={{}}
            initialOpen={resolvedSearchParams.action === "new"}
          />
        </div>
      </AppShell>
    );
  }
}
