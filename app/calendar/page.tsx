import { AppShell } from "@/components/app-shell";
import { CalendarWorkspace } from "@/components/calendar-workspace";
import { getCurrentSession, isWorker } from "@/lib/auth";
import { deriveLeadNextAction } from "@/lib/crm-server";
import { getCalendarData } from "@/lib/jobs-server";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{
    action?: string;
    leadId?: string;
    kind?: "estimate_visit" | "job";
    customerId?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await getCurrentSession();
  const workerMode = isWorker(session?.user.role ?? "OWNER");

  try {
    const { customers: dbCustomers, leads: dbLeads, jobs: dbJobs } = await getCalendarData(
      session ? {
        id: session.user.id,
        companyId: session.user.companyId,
        role: session.user.role
      } : undefined
    );

    return (
      <AppShell pathname="/calendar">
        <CalendarWorkspace
          initialCustomers={dbCustomers.map((customer) => ({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email ?? undefined,
            address: customer.address ?? undefined,
            notes: customer.notes ?? undefined,
            createdAt: customer.createdAt.toISOString()
          }))}
          initialLeads={dbLeads.map((lead) => ({
            id: lead.id,
            customerId: lead.customerId,
            source: lead.source.toLowerCase() as "manual" | "web_form" | "phone" | "whatsapp" | "referral",
            serviceType: lead.serviceType,
            description: lead.description,
            urgency: lead.urgency as "low" | "medium" | "high",
            preferredDate: lead.preferredDate?.toISOString(),
            status: lead.status.toLowerCase() as "new" | "contacted" | "scheduled" | "quoted" | "won" | "lost",
            createdAt: lead.createdAt.toISOString(),
            nextAction: deriveLeadNextAction(lead)
          }))}
          initialJobs={dbJobs.map((job) => ({
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
            estimateDraftedAt: job.estimateDraftedAt?.toISOString()
          }))}
          initialOpen={resolvedSearchParams.action === "schedule"}
          selectedLeadId={resolvedSearchParams.leadId}
          selectedKind={resolvedSearchParams.kind}
          selectedCustomerId={resolvedSearchParams.customerId}
          canSchedule={!workerMode}
          defaultAssignedTo={workerMode ? session?.user.name : undefined}
        />
      </AppShell>
    );
  } catch {
    return (
      <AppShell pathname="/calendar">
        <CalendarWorkspace
          initialCustomers={[]}
          initialLeads={[]}
          initialJobs={[]}
          initialOpen={false}
          selectedLeadId={resolvedSearchParams.leadId}
          selectedKind={resolvedSearchParams.kind}
          selectedCustomerId={resolvedSearchParams.customerId}
          canSchedule={!workerMode}
          defaultAssignedTo={workerMode ? session?.user.name : undefined}
        />
      </AppShell>
    );
  }
}
