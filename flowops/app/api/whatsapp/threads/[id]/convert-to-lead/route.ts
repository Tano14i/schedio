import { jsonCreated } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createLeadFromWhatsAppThread } from "@/lib/whatsapp-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const lead = await createLeadFromWhatsAppThread(id);

  return jsonCreated({
    message: "Thread WhatsApp convertito in customer + lead.",
    item: lead
  });
}
