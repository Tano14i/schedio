import { jsonOk } from "@/lib/api";
import { getSessionFromRequest } from "@/lib/auth";
import { getCalendarData } from "@/lib/jobs-server";

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  const { jobs } = await getCalendarData(
    session
      ? {
          id: session.userId,
          companyId: session.companyId,
          role: session.role
        }
      : undefined
  );
  return jsonOk({
    items: jobs.map((job) => ({
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
      notes: job.notes ?? undefined
    }))
  });
}
