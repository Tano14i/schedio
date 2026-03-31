import { JobCostCategory, JobStatus, JobType, LeadStatus, Prisma, UserRole } from "@prisma/client";
import { calculateJobFinancialSummary } from "@/lib/job-financials";
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
      assignedUser: true,
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      costItems: {
        orderBy: { createdAt: "desc" }
      },
      workLogs: {
        include: {
          user: true
        },
        orderBy: [{ workedAt: "desc" }, { createdAt: "desc" }]
      }
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

export async function addJobCostItem(
  jobId: string,
  input: {
    label: string;
    category: "labor" | "material" | "other";
    qty: number;
    unitCost: number;
    note?: string | null;
  }
) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const item = await prisma.jobCostItem.create({
    data: {
      companyId: job.companyId,
      jobId: job.id,
      label: input.label.trim(),
      category: input.category.toUpperCase() as JobCostCategory,
      qty: Number(input.qty),
      unitCost: Number(input.unitCost),
      note: input.note?.trim() || undefined
    }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_cost_added",
    metadata: {
      message: `Costo aggiunto: ${item.label}.`,
      category: item.category
    }
  });

  const allItems = await prisma.jobCostItem.findMany({
    where: { jobId: job.id }
  });

  return {
    item,
    financials: calculateJobFinancialSummary({
      costs: allItems.map((costItem) => ({
        qty: costItem.qty,
        unitCost: costItem.unitCost
      })),
      revenue: {
        estimateTotal: job.estimates[0]?.total,
        invoiceTotal: job.invoices[0]?.total
      }
    })
  };
}

export async function addJobWorkLog(
  jobId: string,
  input: {
    actorUserId: string;
    hours: number;
    hourlyCost?: number;
    note?: string | null;
    workedAt?: string | null;
  }
) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
  const actor = await prisma.user.findUniqueOrThrow({
    where: { id: input.actorUserId }
  });

  const hourlyCostSnapshot = Number(input.hourlyCost ?? actor.hourlyCost ?? 0);

  const item = await prisma.jobWorkLog.create({
    data: {
      companyId: job.companyId,
      jobId: job.id,
      userId: actor.id,
      hours: Number(input.hours),
      hourlyCostSnapshot,
      note: input.note?.trim() || undefined,
      workedAt: input.workedAt ? new Date(input.workedAt) : undefined
    },
    include: {
      user: true
    }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_work_logged",
    metadata: {
      message: `${item.user.name} ha registrato ${item.hours} ore.`,
      hours: item.hours
    }
  });

  const [allCostItems, allWorkLogs] = await Promise.all([
    prisma.jobCostItem.findMany({
      where: { jobId: job.id }
    }),
    prisma.jobWorkLog.findMany({
      where: { jobId: job.id }
    })
  ]);

  return {
    item,
    financials: calculateJobFinancialSummary({
      costs: [
        ...allCostItems.map((costItem) => ({
          qty: costItem.qty,
          unitCost: costItem.unitCost
        })),
        ...allWorkLogs.map((workLog) => ({
          qty: workLog.hours,
          unitCost: workLog.hourlyCostSnapshot
        }))
      ],
      revenue: {
        estimateTotal: job.estimates[0]?.total,
        invoiceTotal: job.invoices[0]?.total
      }
    })
  };
}

export async function deleteJobCostItem(jobId: string, costItemId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const item = await prisma.jobCostItem.findFirstOrThrow({
    where: {
      id: costItemId,
      jobId
    }
  });

  await prisma.jobCostItem.delete({
    where: { id: item.id }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_cost_deleted",
    metadata: {
      message: `Costo rimosso: ${item.label}.`,
      category: item.category
    }
  });

  const allItems = await prisma.jobCostItem.findMany({
    where: { jobId: job.id }
  });

  return {
    financials: calculateJobFinancialSummary({
      costs: allItems.map((costItem) => ({
        qty: costItem.qty,
        unitCost: costItem.unitCost
      })),
      revenue: {
        estimateTotal: job.estimates[0]?.total,
        invoiceTotal: job.invoices[0]?.total
      }
    })
  };
}

export async function deleteJobWorkLog(jobId: string, workLogId: string) {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      estimates: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  const item = await prisma.jobWorkLog.findFirstOrThrow({
    where: {
      id: workLogId,
      jobId
    },
    include: {
      user: true
    }
  });

  await prisma.jobWorkLog.delete({
    where: { id: item.id }
  });

  await logActivity({
    companyId: job.companyId,
    entityType: "job",
    entityId: job.id,
    eventType: "job_work_log_deleted",
    metadata: {
      message: `Ore rimosse: ${item.user.name}, ${item.hours}h.`
    }
  });

  const [allCostItems, allWorkLogs] = await Promise.all([
    prisma.jobCostItem.findMany({
      where: { jobId: job.id }
    }),
    prisma.jobWorkLog.findMany({
      where: { jobId: job.id }
    })
  ]);

  return {
    financials: calculateJobFinancialSummary({
      costs: [
        ...allCostItems.map((costItem) => ({
          qty: costItem.qty,
          unitCost: costItem.unitCost
        })),
        ...allWorkLogs.map((workLog) => ({
          qty: workLog.hours,
          unitCost: workLog.hourlyCostSnapshot
        }))
      ],
      revenue: {
        estimateTotal: job.estimates[0]?.total,
        invoiceTotal: job.invoices[0]?.total
      }
    })
  };
}
