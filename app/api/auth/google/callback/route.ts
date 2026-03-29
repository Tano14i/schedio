import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostLoginPath } from "@/lib/authz";
import { setSessionCookie } from "@/lib/auth";
import {
  decodeGoogleStateCookie,
  deriveCompanyName,
  exchangeGoogleCode,
  fetchGoogleUserProfile,
  getGoogleStateCookieOptions,
  GOOGLE_STATE_COOKIE_NAME,
  normalizeGoogleEmail
} from "@/lib/google-oauth";

async function findOrCreateGoogleUser(profile: Awaited<ReturnType<typeof fetchGoogleUserProfile>>) {
  const email = normalizeGoogleEmail(profile.email);
  if (!email || !profile.email_verified) {
    throw new Error("missing_email");
  }

  const byGoogleId = await prisma.user.findUnique({
    where: { googleId: profile.sub }
  });

  if (byGoogleId) {
    return byGoogleId;
  }

  const byEmail = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive"
      }
    }
  });

  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.sub) {
      throw new Error("account_conflict");
    }

    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: profile.sub,
        name: profile.name?.trim() || byEmail.name
      }
    });
  }

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: deriveCompanyName(profile),
        email
      }
    });

    return tx.user.create({
      data: {
        companyId: company.id,
        role: "OWNER",
        name: profile.name?.trim() || email.split("@")[0] || "Nuovo owner",
        email,
        googleId: profile.sub
      }
    });
  });
}

function redirectToLogin(request: Request, error: string, next?: string | null) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  if (next) {
    loginUrl.searchParams.set("next", next);
  }
  return loginUrl;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const rawGoogleStateCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_STATE_COOKIE_NAME}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  const googleStateCookie = decodeGoogleStateCookie(rawGoogleStateCookie);
  const next = googleStateCookie?.next || "/";

  if (!code || !state || !googleStateCookie || googleStateCookie.state !== state) {
    const response = NextResponse.redirect(redirectToLogin(request, "google_auth_failed", next), 303);
    response.cookies.set(GOOGLE_STATE_COOKIE_NAME, "", {
      ...getGoogleStateCookieOptions(),
      maxAge: 0
    });
    return response;
  }

  try {
    const token = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserProfile(token.access_token!);
    const user = await findOrCreateGoogleUser(profile);
    const redirectTarget = getPostLoginPath(user.role, next);
    const response = NextResponse.redirect(new URL(redirectTarget, request.url), 303);

    response.cookies.set(GOOGLE_STATE_COOKIE_NAME, "", {
      ...getGoogleStateCookieOptions(),
      maxAge: 0
    });

    setSessionCookie(response, {
      userId: user.id,
      companyId: user.companyId,
      role: user.role
    });

    return response;
  } catch (error) {
    const errorCode =
      error instanceof Error && ["missing_email", "account_conflict"].includes(error.message)
        ? error.message
        : "google_auth_failed";
    const response = NextResponse.redirect(redirectToLogin(request, errorCode, next), 303);
    response.cookies.set(GOOGLE_STATE_COOKIE_NAME, "", {
      ...getGoogleStateCookieOptions(),
      maxAge: 0
    });
    return response;
  }
}
