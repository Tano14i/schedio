import { jsonUpdated } from "@/lib/api";
import { qualifyLead } from "@/lib/lead-qualification-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const item = await qualifyLead(id);
  return jsonUpdated({
    message: "Lead qualificata con regole esplicite.",
    item
  });
}
