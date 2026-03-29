import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_PASSWORD, setSessionCookie } from "@/lib/auth";
import { getPostLoginPath } from "@/lib/authz";

export async function POST(request: Request) {
  const formData = await request.formData();
  const next = formData.get("next")?.toString() || "/";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const password = formData.get("password")?.toString() || "";

  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive"
      }
    }
  });

  if (!user || password !== DEMO_PASSWORD) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_credentials");
    if (next) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl, 303);
  }

  const redirectTarget = getPostLoginPath(user.role, next);
  const response = NextResponse.redirect(new URL(redirectTarget, request.url), 303);
  setSessionCookie(response, {
    userId: user.id,
    companyId: user.companyId,
    role: user.role
  });

  return response;
}
