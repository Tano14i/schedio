import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = await request.json() as { trade?: string };
  const trade = typeof body.trade === "string" ? body.trade.trim() : undefined;

  if (trade === undefined) {
    return Response.json({ error: "Campo 'trade' mancante." }, { status: 400 });
  }

  const company = await prisma.company.findFirstOrThrow({
    where: { id: session.companyId },
    select: { id: true }
  });

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: { trade: trade || null },
    select: { id: true, trade: true }
  });

  return jsonOk({ company: updated });
}
