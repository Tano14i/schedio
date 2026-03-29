import assert from "node:assert/strict";
import {
  createGoogleAuthRequest,
  decodeGoogleStateCookie,
  deriveCompanyName,
  normalizeGoogleEmail
} from "@/lib/google-oauth";

process.env.GOOGLE_CLIENT_ID = "google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
process.env.NEXT_PUBLIC_APP_URL = "https://schedio.test";

{
  const request = createGoogleAuthRequest("/estimates");
  const authUrl = new URL(request.url);
  const stateCookie = decodeGoogleStateCookie(request.cookieValue);

  assert.equal(authUrl.origin, "https://accounts.google.com");
  assert.equal(authUrl.searchParams.get("redirect_uri"), "https://schedio.test/api/auth/google/callback");
  assert.equal(authUrl.searchParams.get("scope"), "openid email profile");
  assert.equal(stateCookie?.next, "/estimates");
  assert.equal(authUrl.searchParams.get("state"), stateCookie?.state);
}

{
  assert.equal(normalizeGoogleEmail("  LUCA@Schedio.IT "), "luca@schedio.it");
  assert.equal(
    deriveCompanyName({
      sub: "google-1",
      given_name: "Luca",
      email: "luca@schedio.it"
    }),
    "Attivita di Luca"
  );
}

console.log("google oauth tests passed");
