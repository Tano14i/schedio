import { cookies } from "next/headers";
import { type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  decodeSessionCookie,
  DEMO_PASSWORD,
  encodeSessionCookie,
  isOwner,
  isWorker,
  SESSION_COOKIE_NAME,
  type SessionPayload
} from "@/lib/auth-cookie";

export type AuthSession = {
  user: User & {
    company: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
    };
  };
};

function parseCookieHeader(header: string | null) {
  if (!header) {
    return {};
  }

  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key || !rest.length) {
      return acc;
    }

    acc[key] = rest.join("=");
    return acc;
  }, {});
}

export function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const cookiesMap = parseCookieHeader(cookieHeader);
  return decodeSessionCookie(cookiesMap[SESSION_COOKIE_NAME]);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = decodeSessionCookie(raw);

  if (!payload?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return { user };
}

export async function requireCurrentSession() {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthenticated");
  }
  return session;
}

export { DEMO_PASSWORD, encodeSessionCookie, isOwner, isWorker, SESSION_COOKIE_NAME };
export type { SessionPayload };
