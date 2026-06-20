import { AppShell } from "@/components/app-shell";
import { JobsWorkspace } from "@/components/jobs-workspace";
import { getCurrentSession, isOwner } from "@/lib/auth";
import { getJobsPageData } from "@/lib/jobs-server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const session = await getCurrentSession();

  try {
    const items = await getJobsPageData(
      session ? {
        id: session.user.id,
        companyId: session.user.companyId,
        role: session.user.role
      } : undefined
    );

    return (
      <AppShell pathname="/jobs">
        <JobsWorkspace
          isOwner={isOwner(session?.user.role ?? "OWNER")}
          jobs={items.map((job) => ({
            id: job.id,
            leadId: job.leadId ?? undefined,
            customerId: job.customerId,
            customerName: job.customer.fullName,
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
            workedHours: job.workedHours,
            laborCost: job.laborCost,
            financials: job.financials
          }))}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/jobs">
        <JobsWorkspace jobs={[]} isOwner={isOwner(session?.user.role ?? "OWNER")} />
      </AppShell>
    );
  }
}
