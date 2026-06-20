import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { buildEstimateAiAssist } from "@/lib/ai-estimates";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      lead: true,
      items: {
        orderBy: { sortOrder: "asc" }
      },
      job: {
        include: {
          costItems: true,
          workLogs: true
        }
      }
    }
  });

  if (!estimate) {
    return Response.json({ message: "Preventivo non trovato." }, { status: 404 });
  }

  const laborCost =
    estimate.job?.workLogs.reduce((sum, item) => sum + item.hours * item.hourlyCostSnapshot, 0) ?? 0;
  const materialCost =
    estimate.job?.costItems
      .filter((item) => item.category === "MATERIAL")
      .reduce((sum, item) => sum + item.qty * item.unitCost, 0) ?? 0;
  const otherCost =
    estimate.job?.costItems
      .filter((item) => item.category !== "MATERIAL")
      .reduce((sum, item) => sum + item.qty * item.unitCost, 0) ?? 0;

  const item = await buildEstimateAiAssist({
    title: estimate.title,
    scopeSummary: estimate.scopeSummary,
    notes: estimate.notes,
    serviceType: estimate.lead?.serviceType ?? estimate.title,
    items: estimate.items.map((entry) => ({
      label: entry.label,
      description: entry.description ?? undefined,
      qty: entry.qty,
      unitPrice: entry.unitPrice
    })),
    laborCost,
    materialCost,
    otherCost
  });

  return jsonOk({ item });
}
