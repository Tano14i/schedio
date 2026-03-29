import {
  LeadSource,
  LeadStatus,
  Prisma
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function getDefaultCompany() {
  return prisma.company.findFirstOrThrow({
    orderBy: { createdAt: "asc" }
  });
}

function formatEventLabel(eventType: string) {
  return eventType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getActivityMessage(log: { eventType: string; metadataJson: Prisma.JsonValue | null }) {
  if (
    log.metadataJson &&
    typeof log.metadataJson === "object" &&
    !Array.isArray(log.metadataJson) &&
    "message" in log.metadataJson &&
    typeof log.metadataJson.message === "string"
  ) {
    return log.metadataJson.message;
  }

  return formatEventLabel(log.eventType);
}

export function deriveLeadNextAction(lead: {
  status: string;
  qualificationStatus?: string | null;
  qualificationReason?: string | null;
}) {
  if (lead.qualificationStatus === "NEEDS_CLARIFICATION") {
    return "Richiedere chiarimento";
  }

  if (lead.qualificationStatus === "OUT_OF_AREA") {
    return "Fuori area";
  }

  if (lead.qualificationStatus === "LOW_PRIORITY") {
    return "Valutare priorita";
  }

  const map: Record<string, string> = {
    NEW: "Richiamare entro 30 minuti",
    CONTACTED: "Proporre data/ora sopralluogo",
    SCHEDULED: "Sopralluogo programmato",
    QUOTED: "Follow-up preventivo",
    WON: "Pianificare intervento",
    LOST: "Nessuna azione"
  };

  return map[lead.status] ?? "Verificare stato lead";
}

async function logActivity(input: {
  companyId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      metadataJson: input.metadata ? toJsonValue(input.metadata) : undefined
    }
  });
}

export async function getLeadsPageData() {
  const company = await getDefaultCompany();
  const [customers, leads, jobs] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.lead.findMany({
      where: { companyId: company.id },
      include: { customer: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.job.findMany({
      where: { companyId: company.id, leadId: { not: null } },
      select: {
        id: true,
        leadId: true
      }
    })
  ]);

  return { company, customers, leads, jobs };
}

export async function createLeadWithCustomer(input: {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  serviceType: string;
  description: string;
  urgency?: "low" | "medium" | "high";
  preferredDate?: string;
  source?: "manual" | "web_form" | "phone" | "whatsapp" | "referral";
}) {
  const company = await getDefaultCompany();

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      companyId: company.id,
      phone: input.phone.trim()
    }
  });

  const customer =
    existingCustomer ??
    (await prisma.customer.create({
      data: {
        companyId: company.id,
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || undefined,
        address: input.address?.trim() || undefined
      }
    }));

  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      source: (input.source ?? "manual").toUpperCase() as LeadSource,
      serviceType: input.serviceType.trim(),
      description: input.description.trim() || "Descrizione non inserita.",
      urgency: input.urgency ?? "medium",
      urgencyLevel: input.urgency ?? "medium",
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
      status: LeadStatus.NEW
    },
    include: { customer: true }
  });

  await logActivity({
    companyId: company.id,
    entityType: "lead",
    entityId: lead.id,
    eventType: "lead_created",
    metadata: {
      message: `Richiesta salvata per ${customer.fullName} - ${lead.serviceType}.`
    }
  });

  return lead;
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: { customer: true }
  });
}

export async function updateLead(
  id: string,
  input: {
    status?: "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost";
    description?: string;
    serviceType?: string;
    urgency?: "low" | "medium" | "high";
    preferredDate?: string | null;
  }
) {
  const existing = await prisma.lead.findUniqueOrThrow({
    where: { id }
  });

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      status: input.status ? input.status.toUpperCase() as LeadStatus : undefined,
      description: input.description ?? undefined,
      serviceType: input.serviceType ?? undefined,
      urgency: input.urgency ?? undefined,
      urgencyLevel: input.urgency ?? undefined,
      preferredDate:
        input.preferredDate === null ? null : input.preferredDate ? new Date(input.preferredDate) : undefined
    },
    include: { customer: true }
  });

  await logActivity({
    companyId: existing.companyId,
    entityType: "lead",
    entityId: lead.id,
    eventType: "lead_updated",
    metadata: {
      message: `Lead aggiornato: ${lead.serviceType}.`
    }
  });

  return lead;
}

export async function getCustomersPageData() {
  const company = await getDefaultCompany();
  return prisma.customer.findMany({
    where: { companyId: company.id },
    include: {
      _count: {
        select: {
          jobs: true,
          estimates: true,
          invoices: true,
          leads: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createCustomer(input: {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  const company = await getDefaultCompany();
  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      address: input.address?.trim() || undefined,
      notes: input.notes?.trim() || undefined
    }
  });

  await logActivity({
    companyId: company.id,
    entityType: "customer",
    entityId: customer.id,
    eventType: "customer_created",
    metadata: {
      message: `Cliente creato: ${customer.fullName}.`
    }
  });

  return customer;
}

export async function getCustomerDetailData(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { createdAt: "desc" }
      },
      jobs: {
        orderBy: { startAt: "desc" }
      },
      estimates: {
        include: { items: true },
        orderBy: { createdAt: "desc" }
      },
      invoices: {
        include: { items: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function updateCustomer(
  id: string,
  input: {
    fullName?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  }
) {
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      fullName: input.fullName ?? undefined,
      phone: input.phone ?? undefined,
      email: input.email === null ? null : input.email ?? undefined,
      address: input.address === null ? null : input.address ?? undefined,
      notes: input.notes === null ? null : input.notes ?? undefined
    }
  });

  await logActivity({
    companyId: customer.companyId,
    entityType: "customer",
    entityId: customer.id,
    eventType: "customer_updated",
    metadata: {
      message: `Scheda cliente aggiornata: ${customer.fullName}.`
    }
  });

  return customer;
}

export async function getActivityFeed() {
  const company = await getDefaultCompany();
  return prisma.activityLog.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}
