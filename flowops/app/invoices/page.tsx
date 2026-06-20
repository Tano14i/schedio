import { AppShell } from "@/components/app-shell";
import { InvoicesWorkspace } from "@/components/invoices-workspace";
import { getInvoiceMetrics, getInvoicePageData, getInvoiceWorklist } from "@/lib/invoices-server";

export default async function InvoicesPage() {
  try {
    const [{ customers: dbCustomers, invoices: dbInvoices, reviewRequests }, metrics, worklist] =
      await Promise.all([getInvoicePageData(), getInvoiceMetrics(), getInvoiceWorklist()]);

    return (
      <AppShell pathname="/invoices">
        <InvoicesWorkspace
          initialCustomers={dbCustomers.map((customer) => ({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email ?? undefined,
            address: customer.address ?? undefined,
            notes: customer.notes ?? undefined,
            createdAt: customer.createdAt.toISOString()
          }))}
          initialInvoices={dbInvoices.map((invoice) => ({
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
            latestReminderStatus: invoice.reminders[0]?.status.toLowerCase() as
              | "scheduled"
              | "sent"
              | "canceled"
              | "failed"
              | undefined,
            items: invoice.items.map((item) => ({
              id: item.id,
              label: item.label,
              description: item.description ?? undefined,
              qty: item.qty,
              unitPrice: item.unitPrice,
              sortOrder: item.sortOrder
            }))
          }))}
          initialMetrics={metrics}
          initialWorklist={worklist.map((item) => ({
            ...item,
            reminderStatus: item.reminderStatus as "scheduled" | "sent" | "canceled" | "failed" | "due" | "none",
            recommendation: item.recommendation as "send_invoice" | "send_reminder" | "mark_paid" | "send_review"
          }))}
          initialReviewRequests={reviewRequests.map((item) => ({
            id: item.id,
            companyId: item.companyId,
            customerId: item.customerId,
            jobId: item.jobId ?? undefined,
            invoiceId: item.invoiceId ?? undefined,
            channel: item.channel,
            reviewLink: item.reviewLink ?? undefined,
            scheduledFor: item.scheduledFor?.toISOString(),
            sentAt: item.sentAt?.toISOString(),
            clickedAt: item.clickedAt?.toISOString(),
            status: item.status.toLowerCase() as "pending" | "sent" | "clicked" | "canceled",
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString()
          }))}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/invoices">
        <div className="space-y-6">
          <div className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900">
            Impossibile caricare fatture, reminder e review request dal database. Riprova tra poco.
          </div>
          <InvoicesWorkspace
            initialCustomers={[]}
            initialInvoices={[]}
            initialMetrics={{
              openInvoices: 0,
              overdueInvoices: 0,
              paidInvoices: 0,
              cashCollectedMonth: 0,
              reviewRequestsSent: 0,
              reviewRequestsClicked: 0,
              avgInvoiceSentToPaidHours: null
            }}
            initialWorklist={[]}
            initialReviewRequests={[]}
          />
        </div>
      </AppShell>
    );
  }
}
