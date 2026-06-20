import { jsonCreated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import {
  buildWhatsAppTemplatePayload,
  buildWhatsAppTextPayload,
  sendWhatsAppTemplate,
  sendWhatsAppTextMessage
} from "@/lib/whatsapp";

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const body = (await request.json()) as {
    to?: string;
    message?: string;
    templateName?: string;
    languageCode?: string;
  };

  if (!body.to || (!body.message && !body.templateName)) {
    return Response.json(
      { message: "Inserisci numero destinatario e testo o template messaggio." },
      { status: 400 }
    );
  }

  const payload = body.templateName
    ? buildWhatsAppTemplatePayload({
        to: body.to,
        templateName: body.templateName,
        languageCode: body.languageCode
      })
    : buildWhatsAppTextPayload(body.to, body.message!);

  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const response = body.templateName
      ? await sendWhatsAppTemplate({
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          to: body.to,
          templateName: body.templateName,
          languageCode: body.languageCode
        })
      : await sendWhatsAppTextMessage({
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          to: body.to,
          body: body.message!
        });
    const result = await response.json();

    return jsonCreated({
      message: response.ok
        ? body.templateName
          ? "Template WhatsApp inviato tramite Cloud API."
          : "Messaggio WhatsApp inviato tramite Cloud API."
        : "Invio WhatsApp fallito.",
      ok: response.ok,
      result
    });
  }

  return jsonCreated({
    message: body.templateName
      ? "Payload template WhatsApp pronto. Mancano credenziali Cloud API per invio reale."
      : "Payload WhatsApp pronto. Mancano credenziali Cloud API per invio reale.",
    endpoint: process.env.WHATSAPP_PHONE_NUMBER_ID
      ? `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION ?? "v22.0"}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
      : "Configura WHATSAPP_PHONE_NUMBER_ID per endpoint completo.",
    payload
  });
}
