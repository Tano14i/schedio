import { jsonCreated } from "@/lib/api";
import { createLeadFromWhatsAppThread } from "@/lib/whatsapp-server";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const lead = await createLeadFromWhatsAppThread(id);

  return jsonCreated({
    message: "Thread WhatsApp convertito in customer + lead.",
    item: lead
  });
}
