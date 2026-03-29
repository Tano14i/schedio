import { AppShell } from "@/components/app-shell";
import { EstimatesWorkspace } from "@/components/estimates-workspace";
import { deriveLeadNextAction, getLeadsPageData } from "@/lib/crm-server";
import { getEstimatePageData } from "@/lib/estimates-server";
import type { EstimateTemplate } from "@/lib/types";

export default async function EstimatesPage() {
  try {
    const [{ estimates, templates }, { customers, leads }] = await Promise.all([
      getEstimatePageData(),
      getLeadsPageData()
    ]);

    return (
      <AppShell pathname="/estimates">
        <EstimatesWorkspace
          initialCustomers={customers.map((customer) => ({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email ?? undefined,
            address: customer.address ?? undefined,
            notes: customer.notes ?? undefined,
            createdAt: customer.createdAt.toISOString()
          }))}
          initialEstimates={estimates.map((estimate) => ({
            id: estimate.id,
            customerId: estimate.customerId,
            leadId: estimate.leadId ?? undefined,
            jobId: estimate.jobId ?? undefined,
            number: estimate.number,
            customerName: estimate.customer.fullName,
            status: estimate.status.toLowerCase() as "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired",
            title: estimate.title ?? undefined,
            introText: estimate.introText ?? undefined,
            scopeSummary: estimate.scopeSummary ?? undefined,
            notes: estimate.notes ?? undefined,
            terms: estimate.terms ?? undefined,
            sentAt: estimate.sentAt?.toISOString(),
            viewedAt: estimate.viewedAt?.toISOString(),
            acceptedAt: estimate.acceptedAt?.toISOString(),
            rejectedAt: estimate.rejectedAt?.toISOString(),
            validUntil: estimate.validUntil?.toISOString(),
            subtotal: estimate.subtotal,
            tax: estimate.tax,
            total: estimate.total,
            publicToken: estimate.publicToken,
            followUpStatus: estimate.followUps[0]?.status as "scheduled" | "sent" | "canceled" | "failed" | undefined,
            followUpReason: estimate.followUps[0]?.reason as "no_view" | "viewed_not_accepted" | undefined,
            items: estimate.items.map((item) => ({
              id: item.id,
              label: item.label,
              description: item.description ?? undefined,
              qty: item.qty,
              unitPrice: item.unitPrice
            }))
          }))}
          initialLeads={leads.map((lead) => ({
            id: lead.id,
            customerId: lead.customerId,
            source: lead.source.toLowerCase() as "manual" | "web_form" | "phone" | "whatsapp" | "referral",
            serviceType: lead.serviceType,
            description: lead.description,
            urgency: lead.urgency as "low" | "medium" | "high",
            preferredDate: lead.preferredDate?.toISOString(),
            status: lead.status.toLowerCase() as "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost",
            qualificationStatus: lead.qualificationStatus?.toLowerCase() as
              | "unqualified"
              | "qualified"
              | "needs_clarification"
              | "out_of_area"
              | "low_priority"
              | "rejected"
              | undefined,
            serviceAreaMatch: lead.serviceAreaMatch?.toLowerCase() as "unknown" | "inside" | "outside" | undefined,
            jobSize: lead.jobSize?.toLowerCase() as "unknown" | "small" | "medium" | "large" | undefined,
            budgetRange: lead.budgetRange?.toLowerCase() as "unknown" | "low" | "medium" | "high" | undefined,
            urgencyLevel: lead.urgencyLevel as "low" | "medium" | "high" | undefined,
            qualificationReason: lead.qualificationReason ?? undefined,
            qualificationConfidence: lead.qualificationConfidence?.toLowerCase() as "high" | "medium" | "low" | undefined,
            nextBestAction: lead.nextBestAction?.toLowerCase() as "propose_visit" | "ask_clarification" | "reject" | "defer" | undefined,
            qualifiedAt: lead.qualifiedAt?.toISOString(),
            createdAt: lead.createdAt.toISOString(),
            nextAction: deriveLeadNextAction(lead)
          }))}
          initialTemplates={templates.map((template) => ({
            ...template,
            serviceType: template.serviceType ?? undefined,
            introText: template.introText ?? undefined,
            scopeSummary: template.scopeSummary ?? undefined,
            notes: template.notes ?? undefined,
            terms: template.terms ?? undefined,
            itemsJson: Array.isArray(template.itemsJson) ? (template.itemsJson as EstimateTemplate["itemsJson"]) : [],
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString()
          }))}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/estimates">
        <div className="space-y-6">
          <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
            Impossibile caricare preventivi e template dal database. Riprova tra poco.
          </div>
          <EstimatesWorkspace
            initialCustomers={[]}
            initialEstimates={[]}
            initialLeads={[]}
            initialTemplates={[]}
          />
        </div>
      </AppShell>
    );
  }
}
