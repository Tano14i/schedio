import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = await request.json() as {
    trade?: string;
    vatNumber?: string | null;
    iban?: string | null;
    defaultTaxRate?: number;
    country?: string;
    currency?: string;
    locale?: string;
  };

  const data: Record<string, unknown> = {};

  if ("trade" in body) {
    data.trade = typeof body.trade === "string" ? body.trade.trim() || null : null;
  }
  if ("vatNumber" in body) {
    data.vatNumber = typeof body.vatNumber === "string" ? body.vatNumber.trim() || null : null;
  }
  if ("iban" in body) {
    data.iban = typeof body.iban === "string" ? body.iban.trim() || null : null;
  }
  if ("defaultTaxRate" in body && typeof body.defaultTaxRate === "number") {
    if (body.defaultTaxRate < 0 || body.defaultTaxRate > 1) {
      return Response.json({ error: "defaultTaxRate deve essere tra 0 e 1 (es. 0.21 per 21%)." }, { status: 400 });
    }
    data.defaultTaxRate = body.defaultTaxRate;
  }
  if ("country" in body && typeof body.country === "string") {
    data.country = body.country.trim().toUpperCase();
  }
  if ("currency" in body && typeof body.currency === "string") {
    data.currency = body.currency.trim().toUpperCase();
  }
  if ("locale" in body && typeof body.locale === "string") {
    data.locale = body.locale.trim();
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nessun campo valido da aggiornare." }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id: session.companyId },
    data,
    select: {
      id: true,
      trade: true,
      vatNumber: true,
      iban: true,
      defaultTaxRate: true,
      country: true,
      currency: true,
      locale: true
    }
  });

  return jsonOk({ company: updated });
}
