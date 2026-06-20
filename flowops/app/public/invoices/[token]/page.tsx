import { notFound } from "next/navigation";
import { PublicInvoiceWorkspace } from "@/components/public-invoice-workspace";
import { getPublicInvoiceData } from "@/lib/invoices-server";

export default async function PublicInvoicePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  try {
    const invoice = await getPublicInvoiceData(token);
    if (!invoice) {
      notFound();
    }

    return (
      <PublicInvoiceWorkspace
        companyName={invoice.company.name}
        initialCustomer={{
          id: invoice.customer.id,
          fullName: invoice.customer.fullName,
          phone: invoice.customer.phone,
          email: invoice.customer.email ?? undefined,
          address: invoice.customer.address ?? undefined,
          notes: invoice.customer.notes ?? undefined,
          createdAt: invoice.customer.createdAt.toISOString()
        }}
        initialInvoice={{
          id: invoice.id,
          customerId: invoice.customerId,
          leadId: invoice.leadId ?? undefined,
          jobId: invoice.jobId ?? undefined,
          estimateId: invoice.estimateId ?? undefined,
          number: invoice.number,
          status: invoice.status.toLowerCase() as "draft" | "sent" | "paid" | "overdue" | "void",
          title: invoice.title ?? undefined,
          notes: invoice.notes ?? undefined,
          terms: invoice.terms ?? undefined,
          dueDate: invoice.dueDate?.toISOString(),
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          sentAt: invoice.sentAt?.toISOString(),
          viewedAt: invoice.viewedAt?.toISOString(),
          paidAt: invoice.paidAt?.toISOString(),
          voidedAt: invoice.voidedAt?.toISOString(),
          publicToken: invoice.publicToken,
          items: invoice.items.map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description ?? undefined,
            qty: item.qty,
            unitPrice: item.unitPrice,
            sortOrder: item.sortOrder
          }))
        }}
      />
    );
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-lg rounded-[32px] border border-white/70 bg-white p-8 text-center shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">Schedio</p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Fattura non disponibile</h1>
          <p className="mt-3 text-sm text-slate-600">
            Non siamo riusciti a caricare questa fattura. Riprova tra poco.
          </p>
        </div>
      </div>
    );
  }
}
