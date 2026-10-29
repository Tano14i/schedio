import { timingSafeEqual } from "node:crypto";
import { getSessionFromRequest } from "@/lib/auth";

export type RunnerScope = { companyId?: string };

function hasValidCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) {
    return false;
  }

  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * I runner girano su tutte le aziende solo se chiamati dal job schedulato
 * (Authorization: Bearer CRON_SECRET). Da un utente loggato girano solo
 * sull'azienda dell'utente.
 */
export async function resolveRunnerScope(request: Request): Promise<RunnerScope | Response> {
  if (hasValidCronSecret(request)) {
    return {};
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Non autorizzato." }, { status: 401 });
  }

  return { companyId: session.companyId };
}
