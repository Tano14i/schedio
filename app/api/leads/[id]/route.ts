import { jsonOk, jsonUpdated } from "@/lib/api";
import { deriveLeadNextAction, getLeadById, updateLead } from "@/lib/crm-server";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const lead = await getLeadById(id);

  return jsonOk({
    item: lead
      ? {
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
        }
      : null
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost";
    description?: string;
    serviceType?: string;
    urgency?: "low" | "medium" | "high";
    preferredDate?: string | null;
  };

  const lead = await updateLead(id, body);

  return jsonUpdated({
    message: "Richiesta aggiornata.",
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
    }
  });
}
