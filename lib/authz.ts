import type { SessionRole } from "@/lib/auth-cookie";

const WORKER_ALLOWED_PATHS = ["/jobs", "/calendar", "/api/jobs", "/api/calendar"];

export function getPostLoginPath(role: SessionRole, next?: string | null) {
  if (role === "WORKER") {
    if (!next || next === "/" || !canAccessPath(role, next)) {
      return "/jobs";
    }
  }

  return next && next.trim() ? next : "/";
}

export function canAccessPath(role: SessionRole, pathname: string) {
  if (role === "OWNER") {
    return true;
  }

  return WORKER_ALLOWED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function getVisibleNavHrefs(role: SessionRole) {
  return role === "WORKER"
    ? ["/calendar", "/jobs"]
    : [
        "/",
        "/leads",
        "/calendar",
        "/whatsapp",
        "/jobs",
        "/customers",
        "/estimates",
        "/invoices",
        "/automations",
        "/settings/company"
      ];
}

export function sanitizeJobPatchForRole(
  role: SessionRole,
  body: {
    title?: string;
    assignedTo?: string | null;
    startAt?: string;
    endAt?: string | null;
    status?: "scheduled" | "on_the_way" | "in_progress" | "completed" | "canceled";
    address?: string;
    notes?: string | null;
  }
) {
  if (role === "OWNER") {
    return body;
  }

  return {
    status: body.status,
    notes: body.notes
  };
}
