import { jsonCreated } from "@/lib/api";
import { createJobFromEstimate } from "@/lib/estimates-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const createdJob = await createJobFromEstimate(id);

    return jsonCreated({
      message: "Lavoro creato dal preventivo.",
      item: {
        id: createdJob.id,
        leadId: createdJob.leadId ?? undefined,
        customerId: createdJob.customerId,
        title: createdJob.title,
        type: createdJob.type.toLowerCase(),
        startAt: createdJob.startAt.toISOString(),
        endAt: createdJob.endAt?.toISOString(),
        status: createdJob.status.toLowerCase(),
        address: createdJob.address,
        notes: createdJob.notes ?? undefined,
        completionStatus: createdJob.completionStatus.toLowerCase(),
        completedAt: createdJob.completedAt?.toISOString(),
        completionNotes: createdJob.completionNotes ?? undefined,
        internalSummary: createdJob.internalSummary ?? undefined,
        estimateDraftedAt: createdJob.estimateDraftedAt?.toISOString()
      }
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Impossibile creare il lavoro dal preventivo.",
        item: null
      },
      { status: 400 }
    );
  }
}
