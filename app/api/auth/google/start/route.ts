import { NextResponse } from "next/server";
import {
  createGoogleAuthRequest,
  getGoogleStateCookieOptions,
  GOOGLE_STATE_COOKIE_NAME
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  try {
    const next = new URL(request.url).searchParams.get("next") || "/";
    const authRequest = createGoogleAuthRequest(next);
    const response = NextResponse.redirect(authRequest.url, 303);

    response.cookies.set(
      GOOGLE_STATE_COOKIE_NAME,
      authRequest.cookieValue,
      getGoogleStateCookieOptions()
    );

    return response;
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(loginUrl, 303);
  }
}
