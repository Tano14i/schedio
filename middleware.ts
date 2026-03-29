import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeSessionCookie, isWorker, SESSION_COOKIE_NAME } from "@/lib/auth-cookie";
import { canAccessPath, getPostLoginPath } from "@/lib/authz";

const PUBLIC_PATHS = ["/login", "/public", "/api/public", "/api/auth", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const session = decodeSessionCookie(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isWorker(session.role)) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL(getPostLoginPath(session.role, pathname), request.url));
    }

    if (!canAccessPath(session.role, pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { message: "Permessi insufficienti per questa azione." },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL("/jobs", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
