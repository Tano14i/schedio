import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createEstimateTemplate, getEstimateTemplates } from "@/lib/estimates-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const items = await getEstimateTemplates();
  return jsonOk({ items });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = (await request.json()) as Parameters<typeof createEstimateTemplate>[0];
  const item = await createEstimateTemplate(body);
  return jsonCreated({
    message: "Template preventivo creato.",
    item
  });
}
