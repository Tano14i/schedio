import { notFound } from "next/navigation";
import { PublicEstimateWorkspace } from "@/components/public-estimate-workspace";
import { getPublicEstimateData } from "@/lib/estimates-server";

export default async function PublicEstimatePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    const estimate = await getPublicEstimateData(token);
    if (!estimate) {
      notFound();
    }

    return (
      <PublicEstimateWorkspace
        companyName={estimate.company.name}
        initialCustomer={{
          id: estimate.customer.id,
          fullName: estimate.customer.fullName,
          phone: estimate.customer.phone,
          email: estimate.customer.email ?? undefined,
          address: estimate.customer.address ?? undefined,
          notes: estimate.customer.notes ?? undefined,
          createdAt: estimate.customer.createdAt.toISOString()
        }}
        initialEstimate={{
          id: estimate.id,
          customerId: estimate.customerId,
          leadId: estimate.leadId ?? undefined,
          jobId: estimate.jobId ?? undefined,
          number: estimate.number,
          status: estimate.status.toLowerCase() as "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired",
          title: estimate.title ?? undefined,
          introText: estimate.introText ?? undefined,
          scopeSummary: estimate.scopeSummary ?? undefined,
          notes: estimate.notes ?? undefined,
          terms: estimate.terms ?? undefined,
          items: estimate.items.map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description ?? undefined,
            qty: item.qty,
            unitPrice: item.unitPrice
          })),
          subtotal: estimate.subtotal,
          tax: estimate.tax,
          total: estimate.total,
          validUntil: estimate.validUntil?.toISOString(),
          sentAt: estimate.sentAt?.toISOString(),
          viewedAt: estimate.viewedAt?.toISOString(),
          acceptedAt: estimate.acceptedAt?.toISOString(),
          rejectedAt: estimate.rejectedAt?.toISOString(),
          publicToken: estimate.publicToken
        }}
      />
    );
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-lg rounded-[32px] border border-white/70 bg-white p-8 text-center shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">Schedio</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Preventivo non disponibile</h1>
          <p className="mt-3 text-sm text-slate-600">
            Non siamo riusciti a caricare questo preventivo. Riprova tra poco.
          </p>
        </div>
      </div>
    );
  }
}
