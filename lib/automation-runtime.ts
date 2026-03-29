import { AutomationChannel, AutomationLogStatus, AutomationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getAutomationChannel(companyId: string, automationType: AutomationType) {
  const automation = await prisma.automation.findFirst({
    where: {
      companyId,
      type: automationType,
      enabled: true
    },
    orderBy: { delayMinutes: "asc" }
  });

  return automation?.channel ?? AutomationChannel.SMS;
}

export async function queueAutomationLog(input: {
  companyId: string;
  automationType: AutomationType;
  customerId: string;
  relatedEntityType: string;
  relatedEntityId: string;
  scheduledFor: Date;
}) {
  const existing = await prisma.automationLog.findFirst({
    where: {
      companyId: input.companyId,
      automationType: input.automationType,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      status: AutomationLogStatus.QUEUED
    }
  });

  if (existing) {
    return existing;
  }

  const channel = await getAutomationChannel(input.companyId, input.automationType);

  return prisma.automationLog.create({
    data: {
      companyId: input.companyId,
      automationType: input.automationType,
      customerId: input.customerId,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      channel,
      status: AutomationLogStatus.QUEUED,
      scheduledFor: input.scheduledFor
    }
  });
}

export async function markAutomationSent(input: {
  automationType: AutomationType;
  relatedEntityType: string;
  relatedEntityId: string;
}) {
  return prisma.automationLog.updateMany({
    where: {
      automationType: input.automationType,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      status: AutomationLogStatus.QUEUED
    },
    data: {
      status: AutomationLogStatus.SENT,
      sentAt: new Date(),
      errorMessage: null
    }
  });
}

export async function markAutomationFailed(input: {
  automationType: AutomationType;
  relatedEntityType: string;
  relatedEntityId: string;
  errorMessage: string;
}) {
  return prisma.automationLog.updateMany({
    where: {
      automationType: input.automationType,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      status: AutomationLogStatus.QUEUED
    },
    data: {
      status: AutomationLogStatus.FAILED,
      errorMessage: input.errorMessage
    }
  });
}

export async function removeQueuedAutomationLogs(input: {
  automationType: AutomationType;
  relatedEntityType: string;
  relatedEntityIds: string[];
}) {
  if (!input.relatedEntityIds.length) {
    return;
  }

  await prisma.automationLog.deleteMany({
    where: {
      automationType: input.automationType,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: {
        in: input.relatedEntityIds
      },
      status: AutomationLogStatus.QUEUED
    }
  });
}
