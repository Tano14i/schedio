import { jsonOk } from "@/lib/api";
import { analyzeWorkIntake } from "@/lib/ai-intake";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    text?: string;
    customerName?: string;
    phone?: string;
    photoCount?: number;
  };

  if (!body.text?.trim()) {
    return Response.json({ message: "text e obbligatorio." }, { status: 400 });
  }

  const item = await analyzeWorkIntake({
    text: body.text,
    customerName: body.customerName,
    phone: body.phone,
    photoCount: body.photoCount
  });

  return jsonOk({ item });
}
