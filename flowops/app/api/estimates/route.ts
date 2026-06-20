import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  createEstimateDraftForCustomer,
  createEstimateDraftFromJob,
  getEstimatePageData
} from "@/lib/estimates-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const { estimates, pagination } = await getEstimatePageData({ page, limit });
  return jsonOk({ data: estimates, pagination });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = (await request.json()) as { jobId?: string; customerId?: string };

  if (body.customerId && !body.jobId) {
    const item = await createEstimateDraftForCustomer(body.customerId);
    return jsonCreated({ message: "Bozza preventivo creata per il cliente.", item });
  }

  if (!body.jobId) {
    return Response.json(
      { message: "Serve un cliente o un job completato per creare la bozza preventivo." },
      { status: 400 }
    );
  }

  const item = await createEstimateDraftFromJob(body.jobId);
  return jsonCreated({
    message: "Bozza preventivo creata dal sopralluogo.",
    item
  });
}
