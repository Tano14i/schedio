import { jsonOk } from "@/lib/api";
import { buildEstimateFollowUpAiAssist } from "@/lib/ai-followups";
import { getAppUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: true,
      followUps: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!estimate) {
    return Response.json({ message: "Preventivo non trovato." }, { status: 404 });
  }

  if (!estimate.publicToken) {
    return Response.json({ item: null }, { status: 200 });
  }

  const item = await buildEstimateFollowUpAiAssist({
    customerName: estimate.customer.fullName,
    title: estimate.title,
    total: estimate.total,
    publicUrl: `${getAppUrl()}/public/estimates/${estimate.publicToken}`,
    viewedAt: estimate.viewedAt,
    reason: estimate.followUps[0]?.reason?.toLowerCase() ?? null
  });

  return jsonOk({ item });
}
