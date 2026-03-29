import { NextRequest, NextResponse } from "next/server";
import { jsonCreated } from "@/lib/api";
import { handleWhatsAppWebhook } from "@/lib/whatsapp-server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }

  return NextResponse.json(
    { message: "Webhook verification failed. Check WHATSAPP_VERIFY_TOKEN." },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = await handleWhatsAppWebhook(payload);

  return jsonCreated({
    message: "Webhook WhatsApp ricevuto e salvato su thread, messaggi e contatti.",
    receivedAt: new Date().toISOString(),
    summary: {
      inboundMessages: parsed.inboundMessages.length,
      statuses: parsed.statuses.length,
      contacts: parsed.contacts.length
    },
    sample: parsed.inboundMessages[0] ?? null
  });
}
