import { jsonCreated, jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createLeadWithCustomer, deriveLeadNextAction, getLeadsPageData } from "@/lib/crm-server";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { leads } = await getLeadsPageData();
  return jsonOk({
    items: leads.map((lead) => ({
      id: lead.id,
      customerId: lead.customerId,
      source: lead.source.toLowerCase(),
      serviceType: lead.serviceType,
      description: lead.description,
      urgency: lead.urgency as "low" | "medium" | "high",
      preferredDate: lead.preferredDate?.toISOString(),
      status: lead.status.toLowerCase(),
      createdAt: lead.createdAt.toISOString(),
      nextAction: deriveLeadNextAction(lead),
      customer: lead.customer
        ? {
            id: lead.customer.id,
            fullName: lead.customer.fullName,
            phone: lead.customer.phone,
            email: lead.customer.email ?? undefined,
            address: lead.customer.address ?? undefined,
            notes: lead.customer.notes ?? undefined,
            createdAt: lead.customer.createdAt.toISOString()
          }
        : null
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
    serviceType?: string;
    description?: string;
    urgency?: "low" | "medium" | "high";
    preferredDate?: string;
    source?: "manual" | "web_form" | "phone" | "whatsapp" | "referral";
  };

  if (!body.fullName?.trim() || !body.phone?.trim() || !body.serviceType?.trim()) {
    return jsonCreated({
      message: "Inserisci nome cliente, telefono e tipo di lavoro.",
      item: null
    });
  }

  const lead = await createLeadWithCustomer({
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    address: body.address,
    serviceType: body.serviceType,
    description: body.description ?? "",
    urgency: body.urgency,
    preferredDate: body.preferredDate,
    source: body.source
  });

  return jsonCreated({
    message: "Richiesta salvata.",
    item: {
      id: lead.id,
      customerId: lead.customerId,
      source: lead.source.toLowerCase(),
      serviceType: lead.serviceType,
      description: lead.description,
      urgency: lead.urgency as "low" | "medium" | "high",
      preferredDate: lead.preferredDate?.toISOString(),
      status: lead.status.toLowerCase(),
      createdAt: lead.createdAt.toISOString(),
      nextAction: deriveLeadNextAction(lead),
      customer: {
        id: lead.customer.id,
        fullName: lead.customer.fullName,
        phone: lead.customer.phone,
        email: lead.customer.email ?? undefined,
        address: lead.customer.address ?? undefined,
        notes: lead.customer.notes ?? undefined,
        createdAt: lead.customer.createdAt.toISOString()
      }
    }
  });
}
