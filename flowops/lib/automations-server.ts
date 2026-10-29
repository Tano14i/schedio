import { AutomationChannel, AutomationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendDueEstimateFollowUps } from "@/lib/estimates-server";
import { sendDueInvoiceReminders, sendDueReviewRequests } from "@/lib/invoices-server";

const coreAutomations = [
  {
    type: AutomationType.ESTIMATE_FOLLOWUP,
    channel: AutomationChannel.SMS,
    delayMinutes: 2880,
    template:
      "Ciao {{firstName}}, hai avuto modo di vedere il preventivo? Se vuoi possiamo chiarire qualsiasi dubbio. {{link}}",
    conditionsJson: { statuses: ["SENT"] }
  },
  {
    type: AutomationType.INVOICE_REMINDER,
    channel: AutomationChannel.SMS,
    delayMinutes: 4320,
    template:
      "Ciao {{firstName}}, ti ricordiamo la fattura {{invoiceNumber}}. Se hai bisogno di chiarimenti siamo a disposizione.",
    conditionsJson: { statuses: ["SENT"], overdueDays: 3 }
  },
  {
    type: AutomationType.REVIEW_REQUEST,
    channel: AutomationChannel.SMS,
    delayMinutes: 1440,
    template:
      "Grazie ancora per averci scelto. Se ti va, ci lasci una recensione? {{reviewLink}}",
    conditionsJson: { statuses: ["PAID"] }
  }
] as const;

export async function ensureCoreAutomations(companyId: string) {
  for (const automation of coreAutomations) {
    const existing = await prisma.automation.findFirst({
      where: {
        companyId,
        type: automation.type
      }
    });

    if (!existing) {
      await prisma.automation.create({
        data: {
          companyId,
          type: automation.type,
          channel: automation.channel,
          enabled: true,
          delayMinutes: automation.delayMinutes,
          template: automation.template,
          conditionsJson: automation.conditionsJson
        }
      });
    }
  }
}

export async function getAutomationsPageData(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  await ensureCoreAutomations(company.id);

  const [automations, recentLogs, queueCounts] = await Promise.all([
    prisma.automation.findMany({
      where: { companyId: company.id },
      orderBy: [{ enabled: "desc" }, { type: "asc" }]
    }),
    prisma.automationLog.findMany({
      where: { companyId: company.id },
      orderBy: [{ sentAt: "desc" }, { scheduledFor: "desc" }],
      take: 12
    }),
    Promise.all([
      prisma.estimateFollowUp.count({
        where: {
          companyId: company.id,
          status: "scheduled",
          canceledAt: null
        }
      }),
      prisma.invoiceReminder.count({
        where: {
          companyId: company.id,
          status: "SCHEDULED",
          canceledAt: null
        }
      }),
      prisma.reviewRequest.count({
        where: {
          companyId: company.id,
          status: "PENDING"
        }
      }),
      prisma.automationLog.count({
        where: {
          companyId: company.id,
          status: "FAILED"
        }
      })
    ])
  ]);

  return {
    company,
    automations,
    recentLogs,
    queueSummary: {
      estimateFollowUps: queueCounts[0],
      invoiceReminders: queueCounts[1],
      reviewRequests: queueCounts[2],
      failedRuns: queueCounts[3]
    }
  };
}

export async function updateAutomation(
  companyId: string,
  automationId: string,
  input: {
    enabled?: boolean;
    template?: string;
    delayMinutes?: number;
  }
) {
  await prisma.automation.findFirstOrThrow({ where: { id: automationId, companyId } });
  return prisma.automation.update({
    where: { id: automationId },
    data: {
      enabled: input.enabled,
      template: input.template,
      delayMinutes: input.delayMinutes
    }
  });
}

/**
 * Con companyId esegue solo le automazioni di quell'azienda (avvio manuale
 * dal pannello). Senza companyId le esegue per tutte (job schedulato).
 */
export async function runAutomationSuite(companyId?: string) {
  if (companyId) {
    await ensureCoreAutomations(companyId);
  }

  const [estimateFollowUpsSent, invoiceRemindersSent, reviewRequestsSent] = await Promise.all([
    sendDueEstimateFollowUps(companyId),
    sendDueInvoiceReminders(companyId),
    sendDueReviewRequests(companyId)
  ]);

  const failedRuns = await prisma.automationLog.count({
    where: {
      ...(companyId ? { companyId } : {}),
      status: "FAILED"
    }
  });

  return {
    estimateFollowUpsSent,
    invoiceRemindersSent,
    reviewRequestsSent,
    failedRuns
  };
}
