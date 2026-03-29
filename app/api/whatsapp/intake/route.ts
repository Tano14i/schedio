import { jsonCreated } from "@/lib/api";
import { createLeadCaptureFromWhatsAppIntake } from "@/lib/whatsapp-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    customerName?: string;
    phone?: string;
    serviceType?: string;
    description?: string;
    address?: string;
    measurements?: string;
    preferredWindow?: string;
    photos?: string[];
  };

  if (!body.customerName || !body.phone || !body.serviceType || !body.description) {
    return Response.json(
      {
        message: "customerName, phone, serviceType e description sono obbligatori."
      },
      { status: 400 }
    );
  }

  const created = await createLeadCaptureFromWhatsAppIntake({
    customerName: body.customerName,
    phone: body.phone,
    serviceType: body.serviceType,
    description: body.description,
    address: body.address,
    measurements: body.measurements,
    preferredWindow: body.preferredWindow,
    photos: body.photos
  });

  return jsonCreated({
    message: "Intake WhatsApp salvato. Thread, contatto e lead sono stati creati.",
    item: created
  });
}
