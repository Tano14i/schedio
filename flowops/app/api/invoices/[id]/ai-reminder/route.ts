import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { buildInvoiceReminderAiAssist } from "@/lib/ai-followups";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      reminders: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!invoice) {
    return Response.json({ message: "Fattura non trovata." }, { status: 404 });
  }

  const item = await buildInvoiceReminderAiAssist({
    customerName: invoice.customer.fullName,
    invoiceNumber: invoice.number,
    total: invoice.total,
    dueDate: invoice.dueDate,
    publicUrl: invoice.publicToken ? `${getAppUrl()}/public/invoices/${invoice.publicToken}` : null,
    reason: invoice.reminders[0]?.reason?.toLowerCase() ?? "overdue"
  });

  return jsonOk({ item });
}
