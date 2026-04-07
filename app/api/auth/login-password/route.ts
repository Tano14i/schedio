import { jsonOk } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  // Confronta sempre un hash (anche se l'utente non esiste) per prevenire
  // timing attacks e user enumeration via differenza di latenza.
  const DUMMY_HASH = "$2a$12$dummy.hash.to.prevent.timing.attacks.padding000000";
  const valid = user?.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

  if (!user || !valid) {
    return Response.json({ error: "Credenziali non valide." }, { status: 401 });
  }

  const response = jsonOk({ userId: user.id });
  await setSessionCookie(response, {
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
  });
  return response;
}
