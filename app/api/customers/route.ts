import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createCustomer, getCustomersPageData } from "@/lib/crm-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const { data: items, pagination } = await getCustomersPageData({ page, limit });
  return jsonOk({
    data: items.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? undefined,
      address: customer.address ?? undefined,
      notes: customer.notes ?? undefined,
      createdAt: customer.createdAt.toISOString(),
      counts: customer._count
    })),
    pagination
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
