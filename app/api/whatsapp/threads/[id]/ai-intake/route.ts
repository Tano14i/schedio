import { jsonOk } from "@/lib/api";
import { analyzeWorkIntake } from "@/lib/ai-intake";
import { prisma } from "@/lib/prisma";
import { WhatsAppMessageDirection, WhatsAppMessageType } from "@prisma/client";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const thread = await prisma.whatsAppThread.findUnique({
    where: { id },
    include: {
      contact: true,
      customer: true,
      messages: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!thread) {
    return Response.json({ message: "Thread non trovato." }, { status: 404 });
  }

  const text = thread.messages
    .filter(
      (message) =>
        message.direction === WhatsAppMessageDirection.INBOUND &&
        message.messageType === WhatsAppMessageType.TEXT &&
        message.textBody
    )
    .map((message) => message.textBody)
    .join("\n")
    .trim();

  const item = await analyzeWorkIntake({
    text: text || "Richiesta WhatsApp da chiarire.",
    customerName: thread.customer?.fullName ?? thread.contact.profileName ?? undefined,
    phone: thread.contact.waId,
    photoCount: thread.messages.filter((message) => message.messageType === WhatsAppMessageType.IMAGE).length
  });

  return jsonOk({ item });
}
