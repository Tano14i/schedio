import { jsonCreated } from "@/lib/api";
import { createLeadCaptureFromWhatsAppIntake } from "@/lib/whatsapp-server";
import { analyzeWorkIntake } from "@/lib/ai-intake";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    customerName?: string;
    phone?: string;
    serviceType?: string;
    description?: string;
    rawIntake?: string;
    address?: string;
    measurements?: string;
    preferredWindow?: string;
    photos?: string[];
  };

  const rawIntake = body.rawIntake?.trim();
  const aiSuggestion = rawIntake
    ? await analyzeWorkIntake({
        text: rawIntake,
        customerName: body.customerName,
        phone: body.phone,
        photoCount: body.photos?.length ?? 0
      })
    : null;

  const customerName = body.customerName?.trim() || aiSuggestion?.customerName;
  const serviceType = body.serviceType?.trim() || aiSuggestion?.serviceType;
  const description = body.description?.trim() || aiSuggestion?.summary || rawIntake;
  const address = body.address?.trim() || aiSuggestion?.address;
  const preferredWindow = body.preferredWindow?.trim() || aiSuggestion?.preferredWindow;
  const measurements = body.measurements?.trim() || aiSuggestion?.measurements;

  if (!customerName || !body.phone || !serviceType || !description) {
    return Response.json(
      {
        message: "customerName, phone e almeno serviceType/description o testo grezzo sono obbligatori."
      },
      { status: 400 }
    );
  }

  const created = await createLeadCaptureFromWhatsAppIntake({
    customerName,
    phone: body.phone,
    serviceType,
    description,
    rawIntake,
    address,
    measurements,
    preferredWindow,
    photos: body.photos
  });

  return jsonCreated({
    message: "Intake WhatsApp salvato. Thread, contatto e lead sono stati creati.",
    item: created
  });
}
