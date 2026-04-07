import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { handleWhatsAppWebhook } from "@/lib/whatsapp-server";

// ── Firma HMAC-SHA256 ────────────────────────────────────────────────────────

async function verifySignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.error("[webhook] WHATSAPP_APP_SECRET non configurato — richiesta rifiutata.");
    return false;
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );

  const expected =
    "sha256=" +
    Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  // Comparazione constant-time per prevenire timing attacks
  return timingSafeEqual(signatureHeader, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── GET — verifica webhook Meta ──────────────────────────────────────────────

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

// ── POST — ricezione messaggi ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Legge il body come testo grezzo — necessario per verificare l'HMAC
  // (request.json() consumerebbe il body rendendo impossibile il calcolo)
  const rawBody = await request.text();

  const isValid = await verifySignature(
    rawBody,
    request.headers.get("x-hub-signature-256")
  );

  if (!isValid) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Risponde 200 immediatamente — Meta considera il webhook fallito dopo 20s
  // e ritrasmetterà il messaggio causando duplicati (problema idempotency).
  // Il processing avviene in background dopo la risposta.
  after(async () => {
    try {
      const payload = JSON.parse(rawBody) as unknown;
      await handleWhatsAppWebhook(payload);
    } catch (err) {
      console.error("[webhook] Errore nel processing background:", err);
    }
  });

  return new NextResponse(null, { status: 200 });
}
