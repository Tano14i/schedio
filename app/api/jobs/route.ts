import { jsonCreated, jsonOk } from "@/lib/api";
import { getSessionFromRequest, isOwner } from "@/lib/auth";
import { createJob, getJobsPageData } from "@/lib/jobs-server";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  const items = await getJobsPageData(
    session
      ? {
          id: session.userId,
          companyId: session.companyId,
          role: session.role
        }
      : undefined
  );
  return jsonOk({
    items: items.map((job) => ({
      id: job.id,
      leadId: job.leadId ?? undefined,
      customerId: job.customerId,
      title: job.title,
      type: job.type.toLowerCase(),
      assignedTo: job.assignedUser?.name ?? undefined,
      startAt: job.startAt.toISOString(),
      endAt: job.endAt?.toISOString(),
      status: job.status.toLowerCase(),
      address: job.address,
      notes: job.notes ?? undefined,
      completionStatus: job.completionStatus.toLowerCase(),
      completedAt: job.completedAt?.toISOString(),
      completionNotes: job.completionNotes ?? undefined,
      internalSummary: job.internalSummary ?? undefined,
      estimateDraftedAt: job.estimateDraftedAt?.toISOString(),
      customer: {
        id: job.customer.id,
        fullName: job.customer.fullName,
        phone: job.customer.phone,
        email: job.customer.email ?? undefined,
        address: job.customer.address ?? undefined,
        notes: job.customer.notes ?? undefined,
        createdAt: job.customer.createdAt.toISOString()
      }
    }))
  });
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session || !isOwner(session.role)) {
    return Response.json({ message: "Permessi insufficienti." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    leadId?: string;
    customerId?: string;
    title?: string;
    type?: "estimate_visit" | "job";
    assignedTo?: string;
    startAt?: string;
    endAt?: string;
    address?: string;
    notes?: string;
  };

  if (!body.customerId || !body.title || !body.type || !body.startAt || !body.address) {
    return Response.json({
      message: "Servono cliente, titolo, tipo, data e indirizzo.",
      item: null
    }, { status: 400 });
  }

  const item = await createJob({
    leadId: body.leadId,
    customerId: body.customerId,
    title: body.title,
    type: body.type,
    assignedTo: body.assignedTo,
    startAt: body.startAt,
    endAt: body.endAt,
    address: body.address,
    notes: body.notes
  });

  return jsonCreated({
    message: "Appuntamento creato.",
    item: {
      id: item.id,
      leadId: item.leadId ?? undefined,
      customerId: item.customerId,
      title: item.title,
      type: item.type.toLowerCase(),
      assignedTo: item.assignedUser?.name ?? undefined,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt?.toISOString(),
      status: item.status.toLowerCase(),
      address: item.address,
      notes: item.notes ?? undefined,
      completionStatus: item.completionStatus.toLowerCase(),
      completedAt: item.completedAt?.toISOString(),
      completionNotes: item.completionNotes ?? undefined,
      internalSummary: item.internalSummary ?? undefined,
      estimateDraftedAt: item.estimateDraftedAt?.toISOString()
    }
  });
}
