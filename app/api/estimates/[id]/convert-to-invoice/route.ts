import { jsonCreated } from "@/lib/api";
import { createInvoiceDraftFromEstimate } from "@/lib/invoices-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const createdInvoice = await createInvoiceDraftFromEstimate(id);

    return jsonCreated({
      message: "Bozza fattura creata dal preventivo.",
      item: {
        id: createdInvoice.id,
        customerId: createdInvoice.customerId,
        leadId: createdInvoice.leadId ?? undefined,
        jobId: createdInvoice.jobId ?? undefined,
        estimateId: createdInvoice.estimateId ?? undefined,
        number: createdInvoice.number,
        status: createdInvoice.status.toLowerCase(),
        title: createdInvoice.title ?? undefined,
        notes: createdInvoice.notes ?? undefined,
        terms: createdInvoice.terms ?? undefined,
        dueDate: createdInvoice.dueDate?.toISOString(),
        subtotal: createdInvoice.subtotal,
        tax: createdInvoice.tax,
        total: createdInvoice.total,
        sentAt: createdInvoice.sentAt?.toISOString(),
        viewedAt: createdInvoice.viewedAt?.toISOString(),
        paidAt: createdInvoice.paidAt?.toISOString(),
        voidedAt: createdInvoice.voidedAt?.toISOString(),
        publicToken: createdInvoice.publicToken
      }
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Impossibile creare la fattura dal preventivo.",
        item: null
      },
      { status: 400 }
    );
  }
}
