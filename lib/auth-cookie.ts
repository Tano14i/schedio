export const SESSION_COOKIE_NAME = "schedio_session";
export const DEMO_PASSWORD = "demo1234";
export type SessionRole = "OWNER" | "WORKER";

export type SessionPayload = {
  userId: string;
  companyId: string;
  role: SessionRole;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return secret;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlToBytes(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const rem = padded.length % 4;
  const withPadding = rem === 0 ? padded : padded + "=".repeat(4 - rem);
  const binary = atob(withPadding);
  // Costruiamo da ArrayBuffer esplicito: new Uint8Array(length) restituisce
  // Uint8Array<ArrayBufferLike> in TypeScript strict, ma crypto.subtle.verify
  // richiede Uint8Array<ArrayBuffer>. Passare new ArrayBuffer() risolve il tipo.
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encodeSessionCookie(payload: SessionPayload): Promise<string> {
  const data = btoa(JSON.stringify(payload));
  const key = await importHmacKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64urlEncode(sig)}`;
}

export async function decodeSessionCookie(value?: string | null): Promise<SessionPayload | null> {
  if (!value) return null;

  const dot = value.lastIndexOf(".");
  if (dot === -1) return null; // vecchio formato plain-base64 → rigettato

  const data = value.slice(0, dot);
  const sigBytes = base64urlToBytes(value.slice(dot + 1));

  try {
    const key = await importHmacKey(getSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );
    if (!valid) return null;
    return JSON.parse(atob(data)) as SessionPayload;
  } catch {
    return null;
  }
}

export function isWorker(role: SessionRole | string) {
  return role === "WORKER";
}

export function isOwner(role: SessionRole | string) {
  return role === "OWNER";
}
