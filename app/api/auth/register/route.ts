import { jsonCreated } from "@/lib/api";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json() as {
    name?: string;
    email?: string;
    password?: string;
    trade?: string;
  };

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const trade = body.trade?.trim() || null;

  if (!name) {
    return Response.json({ error: "Nome obbligatorio." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Email non valida." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password minimo 8 caratteri." }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return Response.json({ error: "Email già registrata." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: { name: `${name} - Schedio`, trade },
    });
    return tx.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        passwordHash,
        role: "OWNER",
      },
    });
  });

  // Email di benvenuto — fire and forget, non blocca la registrazione
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails
      .send({
        from: "onboarding@schedio.it",
        to: email,
        subject: `Benvenuto su Schedio, ${name}!`,
        text: [
          `Ciao ${name},`,
          "",
          "il tuo account è pronto.",
          "",
          "Inizia aggiungendo il tuo primo cliente su schedio.it/customers.",
          "",
          "A presto,",
          "Il team Schedio",
        ].join("\n"),
      })
      .catch((err: unknown) => {
        console.error("[register] Resend error:", err);
      });
  }

  const response = jsonCreated({ userId: user.id });
  await setSessionCookie(response, {
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
  });
  return response;
}
