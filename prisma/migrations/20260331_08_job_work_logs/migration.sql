ALTER TABLE "User"
ADD COLUMN "hourlyCost" DOUBLE PRECISION;

CREATE TABLE "JobWorkLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "hourlyCostSnapshot" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "workedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobWorkLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobWorkLog_companyId_jobId_workedAt_idx" ON "JobWorkLog"("companyId", "jobId", "workedAt");
CREATE INDEX "JobWorkLog_userId_workedAt_idx" ON "JobWorkLog"("userId", "workedAt");

ALTER TABLE "JobWorkLog"
ADD CONSTRAINT "JobWorkLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobWorkLog"
ADD CONSTRAINT "JobWorkLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobWorkLog"
ADD CONSTRAINT "JobWorkLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
