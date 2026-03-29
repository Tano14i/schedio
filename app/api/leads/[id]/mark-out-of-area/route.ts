import { NextBestAction, QualificationStatus } from "@prisma/client";
import { jsonUpdated } from "@/lib/api";
import { setLeadQualification } from "@/lib/lead-qualification-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await setLeadQualification(id, {
    qualificationStatus: QualificationStatus.OUT_OF_AREA,
    nextBestAction: NextBestAction.REJECT,
    qualificationReason: "outside_area"
  });

  return jsonUpdated({
    message: "Lead marcata fuori area e messaggio WhatsApp inviato.",
    item
  });
}
