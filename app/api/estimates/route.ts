import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createEstimateDraftFromJob, getEstimatePageData } from "@/lib/estimates-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { estimates } = await getEstimatePageData();
  return jsonOk({ items: estimates });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = (await request.json()) as { jobId?: string };

  if (!body.jobId) {
    return jsonCreated({
      message: "Serve un job completato per creare la bozza preventivo.",
      item: null
    });
  }

  const item = await createEstimateDraftFromJob(body.jobId);
  return jsonCreated({
    message: "Bozza preventivo creata dal sopralluogo.",
    item
  });
}
