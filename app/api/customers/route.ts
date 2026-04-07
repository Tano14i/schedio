import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createCustomer, getCustomersPageData } from "@/lib/crm-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const items = await getCustomersPageData();
  return jsonOk({
    items: items.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? undefined,
      address: customer.address ?? undefined,
      notes: customer.notes ?? undefined,
      createdAt: customer.createdAt.toISOString(),
      counts: customer._count
    }))
  });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const body = (await request.json().catch(() => ({}))) as {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  };

  if (!body.fullName?.trim() || !body.phone?.trim()) {
    return jsonCreated({
      message: "Inserisci nome cliente e telefono.",
      item: null
    });
  }

  const customer = await createCustomer(body as {
    fullName: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
  });

  return jsonCreated({
    message: "Cliente creato.",
    item: {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? undefined,
      address: customer.address ?? undefined,
      notes: customer.notes ?? undefined,
      createdAt: customer.createdAt.toISOString()
    }
  });
}
