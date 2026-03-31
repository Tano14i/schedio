import { AppShell } from "@/components/app-shell";
import { JobDetailWorkspace } from "@/components/job-detail-workspace";
import { getCurrentSession, isOwner } from "@/lib/auth";
import { getActivityFeed, getActivityMessage } from "@/lib/crm-server";
import { getJobDetailData } from "@/lib/estimates-server";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getCurrentSession();
  const ownerMode = isOwner(session?.user.role ?? "OWNER");

  try {
    const job = await getJobDetailData(resolvedParams.id);
    if (job && session?.user.role === "WORKER" && job.assignedUserId !== session.user.id) {
      throw new Error("Forbidden");
    }
    const activity = await getActivityFeed();
    const entityIds = new Set([
      resolvedParams.id,
      ...(job?.estimates.map((estimate) => estimate.id) ?? [])
    ]);

    return (
      <AppShell pathname={`/jobs/${resolvedParams.id}`}>
        <JobDetailWorkspace
          jobId={resolvedParams.id}
          initialPhotos={
            job?.lead?.whatsappThreads[0]?.messages
              .map((message) => message.storagePath)
              .filter((value): value is string => Boolean(value)) ?? []
          }
          initialJobs={job ? [{
            id: job.id,
            leadId: job.leadId ?? undefined,
            customerId: job.customerId,
            title: job.title,
            type: job.type.toLowerCase() as "estimate_visit" | "job",
            assignedTo: job.assignedUser?.name ?? undefined,
            startAt: job.startAt.toISOString(),
            endAt: job.endAt?.toISOString(),
            status: job.status.toLowerCase() as "scheduled" | "on_the_way" | "in_progress" | "completed" | "canceled",
            address: job.address,
            notes: job.notes ?? undefined,
            completionStatus: job.completionStatus.toLowerCase() as "pending" | "completed",
            completedAt: job.completedAt?.toISOString(),
            completionNotes: job.completionNotes ?? undefined,
            internalSummary: job.internalSummary ?? undefined,
            estimateDraftedAt: job.estimateDraftedAt?.toISOString(),
            costItems: job.costItems.map((item) => ({
              id: item.id,
              jobId: item.jobId,
              label: item.label,
              category: item.category.toLowerCase() as "labor" | "material" | "other",
              qty: item.qty,
              unitCost: item.unitCost,
              note: item.note ?? undefined,
              createdAt: item.createdAt.toISOString()
            })),
            financials: job.financials,
            estimates: job.estimates.map((estimate) => ({
              id: estimate.id,
              customerId: estimate.customerId,
              leadId: estimate.leadId ?? undefined,
              jobId: estimate.jobId ?? undefined,
              number: estimate.number,
              status: estimate.status.toLowerCase() as "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired",
              title: estimate.title ?? undefined,
              introText: estimate.introText ?? undefined,
              scopeSummary: estimate.scopeSummary ?? undefined,
              notes: estimate.notes ?? undefined,
              terms: estimate.terms ?? undefined,
              subtotal: estimate.subtotal,
              tax: estimate.tax,
              total: estimate.total,
              validUntil: estimate.validUntil?.toISOString(),
              sentAt: estimate.sentAt?.toISOString(),
              viewedAt: estimate.viewedAt?.toISOString(),
              acceptedAt: estimate.acceptedAt?.toISOString(),
              rejectedAt: estimate.rejectedAt?.toISOString(),
              publicToken: estimate.publicToken,
              items: estimate.items.map((item) => ({
                id: item.id,
                label: item.label,
                description: item.description ?? undefined,
                qty: item.qty,
                unitPrice: item.unitPrice
              }))
            }))
          }] : []}
          initialCustomers={job?.customer ? [{
            id: job.customer.id,
            fullName: job.customer.fullName,
            phone: job.customer.phone,
            email: job.customer.email ?? undefined,
            address: job.customer.address ?? undefined,
            notes: job.customer.notes ?? undefined,
            createdAt: job.customer.createdAt.toISOString()
          }] : []}
          initialActivity={activity
            .filter((item) => entityIds.has(item.entityId))
            .map((item) => ({
              id: item.id,
              entityType: item.entityType as "lead" | "job" | "estimate" | "invoice" | "customer" | "whatsapp",
              entityId: item.entityId,
              eventType: item.eventType,
              message: getActivityMessage(item),
              createdAt: item.createdAt.toISOString()
            }))}
          initialEstimates={job?.estimates.map((estimate) => ({
            id: estimate.id,
            customerId: estimate.customerId,
            leadId: estimate.leadId ?? undefined,
            jobId: estimate.jobId ?? undefined,
            number: estimate.number,
            status: estimate.status.toLowerCase() as "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired",
            title: estimate.title ?? undefined,
            introText: estimate.introText ?? undefined,
            scopeSummary: estimate.scopeSummary ?? undefined,
            notes: estimate.notes ?? undefined,
            terms: estimate.terms ?? undefined,
            subtotal: estimate.subtotal,
            tax: estimate.tax,
            total: estimate.total,
            validUntil: estimate.validUntil?.toISOString(),
            sentAt: estimate.sentAt?.toISOString(),
            viewedAt: estimate.viewedAt?.toISOString(),
            acceptedAt: estimate.acceptedAt?.toISOString(),
            rejectedAt: estimate.rejectedAt?.toISOString(),
            publicToken: estimate.publicToken,
            items: estimate.items.map((item) => ({
              id: item.id,
              label: item.label,
              description: item.description ?? undefined,
              qty: item.qty,
              unitPrice: item.unitPrice
            }))
          })) ?? []}
          isOwner={ownerMode}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname={`/jobs/${resolvedParams.id}`}>
        <JobDetailWorkspace
          jobId={resolvedParams.id}
          initialJobs={[]}
          initialCustomers={[]}
          initialActivity={[]}
          initialEstimates={[]}
          initialPhotos={[]}
          isOwner={ownerMode}
        />
      </AppShell>
    );
  }
}
