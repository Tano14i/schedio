import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.cookies.set("flowops_demo_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}
