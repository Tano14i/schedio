import { jsonCreated, jsonOk } from "@/lib/api";
import { createEstimateTemplate, getEstimateTemplates } from "@/lib/estimates-server";

export async function GET() {
  const items = await getEstimateTemplates();
  return jsonOk({ items });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Parameters<typeof createEstimateTemplate>[0];
  const item = await createEstimateTemplate(body);
  return jsonCreated({
    message: "Template preventivo creato.",
    item
  });
}
