import { createHash, randomUUID } from "node:crypto";
import { getAppUrl } from "@/lib/app-url";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
export const GOOGLE_STATE_COOKIE_NAME = "schedio_google_state";

type GoogleOAuthCookiePayload = {
  state: string;
  next: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export type GoogleUserProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function encodePayload(payload: GoogleOAuthCookiePayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeGoogleStateCookie(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleOAuthCookiePayload;
  } catch {
    return null;
  }
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth non configurato.");
  }

  return { clientId, clientSecret };
}

export function getGoogleCallbackUrl() {
  return `${getAppUrl()}/api/auth/google/callback`;
}

export function createGoogleAuthRequest(next: string) {
  const { clientId } = getGoogleConfig();
  const state = randomUUID();
  const url = new URL(GOOGLE_AUTH_URL);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getGoogleCallbackUrl());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);

  return {
    url: url.toString(),
    cookieValue: encodePayload({
      state,
      next
    })
  };
}

export function getGoogleStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  };
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret } = getGoogleConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleCallbackUrl(),
    grant_type: "authorization_code"
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const json = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Token exchange Google fallito.");
  }

  return json;
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  const json = (await response.json()) as GoogleUserProfile;

  if (!response.ok || !json.sub) {
    throw new Error("Profilo Google non disponibile.");
  }

  return json;
}

export function normalizeGoogleEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function deriveCompanyName(profile: GoogleUserProfile) {
  const firstName = profile.given_name?.trim();
  if (firstName) {
    return `Attivita di ${firstName}`;
  }

  const fullName = profile.name?.trim();
  if (fullName) {
    return `Attivita di ${fullName}`;
  }

  const localPart = normalizeGoogleEmail(profile.email).split("@")[0];
  return localPart ? `Attivita di ${localPart}` : "Nuova attivita";
}

export function hashGoogleSubject(subject: string) {
  return createHash("sha256").update(subject).digest("hex");
}
