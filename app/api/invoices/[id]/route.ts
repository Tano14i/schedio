import { jsonOk, jsonUpdated } from "@/lib/api";
import { getInvoicePageData, updateInvoice } from "@/lib/invoices-server";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { invoices } = await getInvoicePageData();
  const item = invoices.find((invoice) => invoice.id === id) ?? null;
  return jsonOk({ item });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string | null;
    notes?: string | null;
    terms?: string | null;
    dueDate?: string | null;
    items?: Array<{
      label: string;
      description?: string | null;
      qty: number;
      unitPrice: number;
      sortOrder?: number;
    }>;
  };

  const item = await updateInvoice(id, body);
  return jsonUpdated({
    message: "Fattura aggiornata.",
    item
  });
}
