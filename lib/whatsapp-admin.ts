import { prisma } from "@/lib/prisma";
import type { WhatsAppAdminItem } from "@/components/whatsapp-admin-panel";

export async function getWhatsAppAdminItems(): Promise<WhatsAppAdminItem[]> {
  const threads = await prisma.whatsAppThread.findMany({
    include: {
      contact: true,
      customer: true,
      lead: {
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      },
      messages: {
        orderBy: { createdAt: "asc" }
      },
      proposals: {
        include: {
          selectedSlot: true
        },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { lastMessageAt: "desc" }
  });

  return threads.map((thread) => {
    const proposal = thread.proposals[0];

    return {
      id: thread.id,
      customerName: thread.customer?.fullName ?? thread.contact.profileName ?? thread.contact.waId,
      phone: thread.contact.waId,
      status: thread.status,
      customerId: thread.customerId,
      serviceType: thread.lead?.serviceType,
      description:
        thread.messages
          .map((message) => message.textBody)
          .filter(Boolean)
          .join("\n") || undefined,
      address: thread.customer?.address ?? undefined,
      photoCount: thread.messages.filter((message) => message.messageType === "IMAGE").length,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      leadId: thread.leadId,
      jobId: thread.lead?.jobs[0]?.id ?? null,
      qualificationStatus: thread.lead?.qualificationStatus,
      nextBestAction: thread.lead?.nextBestAction,
      qualificationReason: thread.lead?.qualificationReason,
      qualificationConfidence: thread.lead?.qualificationConfidence,
      messages: thread.messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        type: message.messageType,
        text: message.textBody,
        storagePath: message.storagePath,
        createdAt: message.createdAt.toISOString()
      })),
      proposal: proposal
        ? {
            id: proposal.id,
            status: proposal.status,
            publicToken: proposal.publicToken,
            slotLabel: proposal.selectedSlot
              ? new Intl.DateTimeFormat("it-IT", {
                  dateStyle: "medium",
                  timeStyle: "short"
                }).format(proposal.selectedSlot.startsAt)
              : undefined,
            candidateCount: Array.isArray(proposal.candidateSlotsJson)
              ? proposal.candidateSlotsJson.length
              : 0
          }
        : null
    };
  });
}
