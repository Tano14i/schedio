import { jsonCreated, jsonOk } from "@/lib/api";
import { createServiceArea, getServiceAreas } from "@/lib/lead-qualification-server";

export async function GET() {
  const items = await getServiceAreas();
  return jsonOk({ items });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    label?: string;
    city?: string;
    postalCodePrefix?: string;
    active?: boolean;
  };

  if (!body.label) {
    return Response.json({ message: "Inserisci il nome della zona servita." }, { status: 400 });
  }

  const item = await createServiceArea(body as { label: string; city?: string; postalCodePrefix?: string; active?: boolean });
  return jsonCreated({ item });
}
