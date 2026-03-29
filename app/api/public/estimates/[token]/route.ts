import { jsonOk } from "@/lib/api";
import { getPublicEstimateData } from "@/lib/estimates-server";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const item = await getPublicEstimateData(token);
  return jsonOk({ item });
}
