CREATE TYPE "QualificationStatus" AS ENUM (
  'UNQUALIFIED',
  'QUALIFIED',
  'NEEDS_CLARIFICATION',
  'OUT_OF_AREA',
  'LOW_PRIORITY',
  'REJECTED'
);

CREATE TYPE "ServiceAreaMatch" AS ENUM (
  'UNKNOWN',
  'INSIDE',
  'OUTSIDE'
);

CREATE TYPE "JobSize" AS ENUM (
  'UNKNOWN',
  'SMALL',
  'MEDIUM',
  'LARGE'
);

CREATE TYPE "BudgetRange" AS ENUM (
  'UNKNOWN',
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE "NextBestAction" AS ENUM (
  'PROPOSE_VISIT',
  'ASK_CLARIFICATION',
  'REJECT',
  'DEFER'
);

CREATE TYPE "QualificationConfidence" AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW'
);

ALTER TABLE "Lead"
ADD COLUMN "qualificationStatus" "QualificationStatus" NOT NULL DEFAULT 'UNQUALIFIED',
ADD COLUMN "serviceAreaMatch" "ServiceAreaMatch" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "jobSize" "JobSize" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "budgetRange" "BudgetRange" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "urgencyLevel" TEXT,
ADD COLUMN "qualificationReason" TEXT,
ADD COLUMN "qualificationConfidence" "QualificationConfidence",
ADD COLUMN "nextBestAction" "NextBestAction",
ADD COLUMN "qualifiedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "ServiceArea" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "city" TEXT,
  "postalCodePrefix" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceArea_companyId_active_idx" ON "ServiceArea"("companyId", "active");

ALTER TABLE "ServiceArea"
ADD CONSTRAINT "ServiceArea_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
