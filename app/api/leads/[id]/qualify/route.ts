import { jsonUpdated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { qualifyLead } from "@/lib/lead-qualification-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const item = await qualifyLead(id);
  return jsonUpdated({
    message: "Lead qualificata con regole esplicite.",
    item
  });
}
