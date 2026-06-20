import { jsonOk, jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getCustomerDetailData, updateCustomer } from "@/lib/crm-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await getCustomerDetailData(id);
  return jsonOk({ item });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    fullName?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  };

  const item = await updateCustomer(id, body);
  return jsonUpdated({
    message: "Cliente aggiornato.",
    item
  });
}
