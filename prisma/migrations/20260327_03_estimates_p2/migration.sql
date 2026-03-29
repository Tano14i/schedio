CREATE TYPE "JobCompletionStatus" AS ENUM ('PENDING', 'COMPLETED');

ALTER TABLE "Job"
ADD COLUMN "completionStatus" "JobCompletionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "completionNotes" TEXT,
ADD COLUMN "internalSummary" TEXT,
ADD COLUMN "estimateDraftedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Estimate"
ADD COLUMN "title" TEXT,
ADD COLUMN "introText" TEXT,
ADD COLUMN "scopeSummary" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "terms" TEXT,
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "EstimateTemplate" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "serviceType" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "introText" TEXT,
  "scopeSummary" TEXT,
  "notes" TEXT,
  "terms" TEXT,
  "itemsJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstimateTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EstimateTemplate_companyId_active_idx" ON "EstimateTemplate"("companyId", "active");

ALTER TABLE "EstimateTemplate"
ADD CONSTRAINT "EstimateTemplate_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
