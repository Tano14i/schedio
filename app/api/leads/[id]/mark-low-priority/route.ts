import { NextBestAction, QualificationStatus } from "@prisma/client";
import { jsonUpdated } from "@/lib/api";
import { setLeadQualification } from "@/lib/lead-qualification-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await setLeadQualification(id, {
    qualificationStatus: QualificationStatus.LOW_PRIORITY,
    nextBestAction: NextBestAction.DEFER,
    qualificationReason: "too_small"
  });

  return jsonUpdated({
    message: "Lead marcata a bassa priorita.",
    item
  });
}
