-- CreateEnum
CREATE TYPE "JobCostCategory" AS ENUM ('LABOR', 'MATERIAL', 'OTHER');

-- CreateTable
CREATE TABLE "JobCostItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "JobCostCategory" NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCostItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobCostItem_companyId_jobId_createdAt_idx" ON "JobCostItem"("companyId", "jobId", "createdAt");

-- AddForeignKey
ALTER TABLE "JobCostItem" ADD CONSTRAINT "JobCostItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostItem" ADD CONSTRAINT "JobCostItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
