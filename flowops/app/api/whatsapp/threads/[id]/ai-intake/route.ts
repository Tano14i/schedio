import { jsonOk } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { analyzeWorkIntake } from "@/lib/ai-intake";
import { prisma } from "@/lib/prisma";
import { collectInboundIntakeText } from "@/lib/whatsapp-ai";
import { WhatsAppMessageDirection, WhatsAppMessageType } from "@prisma/client";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession(request);
  if (session instanceof Response) return session;
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

  const text = collectInboundIntakeText(
    thread.messages
      .filter(
        (message) =>
          message.direction === WhatsAppMessageDirection.INBOUND &&
          Boolean(message.textBody) &&
          (message.messageType === WhatsAppMessageType.TEXT ||
            message.messageType === WhatsAppMessageType.DOCUMENT ||
            message.messageType === WhatsAppMessageType.IMAGE)
      )
      .map((message) => ({
        direction: message.direction,
        messageType: message.messageType,
        textBody: message.textBody,
        mimeType: message.mimeType
      }))
  );

  const item = await analyzeWorkIntake({
    text: text || "Richiesta WhatsApp da chiarire.",
    customerName: thread.customer?.fullName ?? thread.contact.profileName ?? undefined,
    phone: thread.contact.waId,
    photoCount: thread.messages.filter((message) => message.messageType === WhatsAppMessageType.IMAGE).length
  });

  return jsonOk({ item });
}
