import { JobStatus, JobType, LeadStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type JobsAccessUser = {
  id: string;
  companyId: string;
  role: UserRole;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function getDefaultCompany() {
  return prisma.company.findFirstOrThrow({
    orderBy: { createdAt: "asc" }
  });
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

async function findAssignedUser(companyId: string, assignedTo?: string) {
  if (!assignedTo?.trim()) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      companyId,
      name: {
        equals: assignedTo.trim(),
        mode: "insensitive"
      }
    }
  });
}

export async function getJobsPageData(currentUser?: JobsAccessUser) {
  const company = currentUser
    ? { id: currentUser.companyId }
    : await getDefaultCompany();
  return prisma.job.findMany({
    where: {
      companyId: company.id,
      ...(currentUser?.role === UserRole.WORKER ? { assignedUserId: currentUser.id } : {})
    },
    include: {
      customer: true,
      assignedUser: true
    },
    orderBy: { startAt: "asc" }
  });
}

export async function getCalendarData(currentUser?: JobsAccessUser) {
  const company = currentUser
    ? { id: currentUser.companyId }
    : await getDefaultCompany();
  const jobWhere = {
    companyId: company.id,
    ...(currentUser?.role === UserRole.WORKER ? { assignedUserId: currentUser.id } : {})
  };
  const jobs = await prisma.job.findMany({
      where: jobWhere,
      include: {
        customer: true,
        assignedUser: true
      },
      orderBy: { startAt: "asc" }
    });

  const customerIds = [...new Set(jobs.map((job) => job.customerId))];
  const leadIds = [...new Set(jobs.map((job) => job.leadId).filter(Boolean))] as string[];

  const [customers, leads] = await Promise.all([
    prisma.customer.findMany({
      where: currentUser?.role === UserRole.WORKER
        ? { id: { in: customerIds } }
        : { companyId: company.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.lead.findMany({
      where: currentUser?.role === UserRole.WORKER
        ? { id: { in: leadIds } }
        : { companyId: company.id },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return { customers, leads, jobs };
}

export async function createJob(input: {
  leadId?: string;
  customerId: string;
  title: string;
  type: "estimate_visit" | "job";
  assignedTo?: string;
  startAt: string;
  endAt?: string;
  address: string;
  notes?: string;
}) {
  const company = await getDefaultCompany();
  const assignedUser = await findAssignedUser(company.id, input.assignedTo);

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      leadId: input.leadId,
      customerId: input.customerId,
      assignedUserId: assignedUser?.id,
      title: input.title.trim(),
      type: input.type === "job" ? JobType.JOB : JobType.ESTIMATE_VISIT,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : undefined,
      status: JobStatus.SCHEDULED,
      address: input.address.trim(),
      notes: input.notes?.trim() || undefined
    },
    include: {
      customer: true,
      assignedUser: true
    }
  });

  if (input.leadId) {
    await prisma.lead.update({
      where: { id: input.leadId },
      data: {
        status: input.type === "job" ? LeadStatus.WON : LeadStatus.SCHEDULED
      }
    });
  }

  await logActivity({
    companyId: company.id,
    entityType: "job",
    entityId: job.id,
    eventType: "job_scheduled",
    metadata: {
      message: `${input.type === "job" ? "Lavoro" : "Sopralluogo"} programmato per ${job.customer.fullName}.`
    }
  });

  if (input.leadId) {
    await logActivity({
      companyId: company.id,
      entityType: "lead",
      entityId: input.leadId,
      eventType: "lead_updated",
      metadata: {
        message: `Richiesta aggiornata dopo pianificazione ${input.type === "job" ? "lavoro" : "sopralluogo"}.`
      }
    });
  }

  return job;
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedUser: true
    }
  });
}

export async function getJobByIdForUser(id: string, currentUser?: JobsAccessUser) {
  const job = await getJobById(id);

  if (!job) {
    return null;
  }

  if (currentUser?.role === UserRole.WORKER && job.assignedUserId !== currentUser.id) {
    return null;
  }

  return job;
}

export async function updateJob(
  id: string,
  input: {
    title?: string;
    assignedTo?: string | null;
    startAt?: string;
    endAt?: string | null;
    status?: "scheduled" | "on_the_way" | "in_progress" | "completed" | "canceled";
    address?: string;
    notes?: string | null;
  }
) {
  const existing = await prisma.job.findUniqueOrThrow({
    where: { id }
  });
  const assignedUser =
    input.assignedTo === undefined
      ? undefined
      : input.assignedTo === null
        ? null
        : await findAssignedUser(existing.companyId, input.assignedTo);

  const job = await prisma.job.update({
    where: { id },
    data: {
      title: input.title ?? undefined,
      assignedUserId:
        input.assignedTo === undefined ? undefined : assignedUser?.id ?? null,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt === null ? null : input.endAt ? new Date(input.endAt) : undefined,
      status: input.status ? input.status.toUpperCase() as JobStatus : undefined,
      address: input.address ?? undefined,
      notes: input.notes === null ? null : input.notes ?? undefined
    },
    include: {
      customer: true,
      assignedUser: true
    }
  });

  await logActivity({
    companyId: existing.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_updated",
    metadata: {
      message: `Lavoro aggiornato: ${job.title}.`
    }
  });

  return job;
}
