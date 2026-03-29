export const SESSION_COOKIE_NAME = "schedio_session";
export const DEMO_PASSWORD = "demo1234";
export type SessionRole = "OWNER" | "WORKER";

export type SessionPayload = {
  userId: string;
  companyId: string;
  role: SessionRole;
};

export function encodeSessionCookie(payload: SessionPayload) {
  return btoa(JSON.stringify(payload));
}

export function decodeSessionCookie(value?: string | null): SessionPayload | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(atob(value)) as SessionPayload;
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
