import { jsonCreated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEstimateTotals, nextEstimateNumber } from "@/lib/estimates-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const existing = await prisma.estimate.findUniqueOrThrow({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } }
  });

  const taxRate = existing.taxRate;
  const totals = calculateEstimateTotals(
    existing.items.map((item) => ({
      label: item.label,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder
    })),
    taxRate
  );
  const number = await nextEstimateNumber(existing.companyId);

  const item = await prisma.estimate.create({
    data: {
      companyId: existing.companyId,
      customerId: existing.customerId,
      leadId: existing.leadId,
      jobId: existing.jobId,
      number,
      status: "DRAFT",
      title: existing.title,
      introText: existing.introText,
      scopeSummary: existing.scopeSummary,
      notes: existing.notes,
      terms: existing.terms,
      validUntil: existing.validUntil,
      taxRate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      publicToken: crypto.randomUUID(),
      items: {
        create: totals.items
      }
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  return jsonCreated({
    message: "Preventivo duplicato in bozza.",
    item
  });
}
