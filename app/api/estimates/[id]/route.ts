import { prisma } from "@/lib/prisma";
import { jsonOk, jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { updateEstimate } from "@/lib/estimates-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } }
    }
  });

  return jsonOk({ item });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const { id } = await context.params;
  const body = (await request.json()) as Parameters<typeof updateEstimate>[1];
  const item = await updateEstimate(id, body);

  return jsonUpdated({
    message: "Preventivo aggiornato.",
    item
  });
}
