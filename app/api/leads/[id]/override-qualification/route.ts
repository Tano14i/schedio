import {
  NextBestAction,
  QualificationStatus
} from "@prisma/client";
import { jsonUpdated } from "@/lib/api";
import { overrideLeadQualification } from "@/lib/lead-qualification-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    qualificationStatus?: keyof typeof QualificationStatus;
    nextBestAction?: keyof typeof NextBestAction;
    qualificationReason?: string;
  };

  if (!body.qualificationStatus || !body.nextBestAction || !body.qualificationReason) {
    return Response.json(
      { message: "qualificationStatus, nextBestAction e qualificationReason sono obbligatori." },
      { status: 400 }
    );
  }

  const item = await overrideLeadQualification(id, {
    qualificationStatus: QualificationStatus[body.qualificationStatus],
    nextBestAction: NextBestAction[body.nextBestAction],
    qualificationReason: body.qualificationReason
  });

  return jsonUpdated({
    message: "Qualifica lead aggiornata manualmente.",
    item
  });
}
