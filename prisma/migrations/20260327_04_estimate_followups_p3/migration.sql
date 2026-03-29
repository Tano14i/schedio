CREATE TABLE "EstimateFollowUp" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "estimateId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstimateFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EstimateFollowUp_companyId_status_scheduledFor_idx"
ON "EstimateFollowUp"("companyId", "status", "scheduledFor");

CREATE INDEX "EstimateFollowUp_estimateId_idx"
ON "EstimateFollowUp"("estimateId");

ALTER TABLE "EstimateFollowUp"
ADD CONSTRAINT "EstimateFollowUp_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EstimateFollowUp"
ADD CONSTRAINT "EstimateFollowUp_estimateId_fkey"
FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
