import { jsonCreated } from "@/lib/api";
import { buildWhatsAppTextPayload, sendWhatsAppTextMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const body = (await request.json()) as { to?: string; message?: string };

  if (!body.to || !body.message) {
    return Response.json(
      { message: "Inserisci numero destinatario e testo messaggio." },
      { status: 400 }
    );
  }

  const payload = buildWhatsAppTextPayload(body.to, body.message);

  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const response = await sendWhatsAppTextMessage({
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      to: body.to,
      body: body.message
    });
    const result = await response.json();

    return jsonCreated({
      message: response.ok
        ? "Messaggio WhatsApp inviato tramite Cloud API."
        : "Invio WhatsApp fallito.",
      ok: response.ok,
      result
    });
  }

  return jsonCreated({
    message: "Payload WhatsApp pronto. Mancano credenziali Cloud API per invio reale.",
    endpoint: process.env.WHATSAPP_PHONE_NUMBER_ID
      ? `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION ?? "v22.0"}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
      : "Configura WHATSAPP_PHONE_NUMBER_ID per endpoint completo.",
    payload
  });
}
