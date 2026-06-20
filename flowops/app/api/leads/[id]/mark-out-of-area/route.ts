import { NextBestAction, QualificationStatus } from "@prisma/client";
import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { setLeadQualification } from "@/lib/lead-qualification-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
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
