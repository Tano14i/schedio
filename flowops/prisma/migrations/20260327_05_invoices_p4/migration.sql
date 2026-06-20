CREATE TYPE "InvoiceReminderStatus" AS ENUM ('SCHEDULED', 'SENT', 'CANCELED', 'FAILED');
CREATE TYPE "InvoiceReminderReason" AS ENUM ('BEFORE_DUE', 'OVERDUE');
CREATE TYPE "ReviewRequestStatus" AS ENUM ('PENDING', 'SENT', 'CLICKED', 'CANCELED');

ALTER TABLE "Invoice"
ADD COLUMN "leadId" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "terms" TEXT,
ADD COLUMN "sentAt" TIMESTAMP(3),
ADD COLUMN "viewedAt" TIMESTAMP(3),
ADD COLUMN "voidedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "InvoiceReminder" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "status" "InvoiceReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
  "reason" "InvoiceReminderReason" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "jobId" TEXT,
  "invoiceId" TEXT,
  "channel" TEXT NOT NULL,
  "reviewLink" TEXT,
  "scheduledFor" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "status" "ReviewRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvoiceReminder_companyId_status_scheduledFor_idx"
ON "InvoiceReminder"("companyId", "status", "scheduledFor");

CREATE INDEX "InvoiceReminder_invoiceId_idx"
ON "InvoiceReminder"("invoiceId");

CREATE INDEX "ReviewRequest_companyId_status_scheduledFor_idx"
ON "ReviewRequest"("companyId", "status", "scheduledFor");

CREATE INDEX "ReviewRequest_customerId_idx"
ON "ReviewRequest"("customerId");

CREATE INDEX "Invoice_leadId_idx"
ON "Invoice"("leadId");

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceReminder"
ADD CONSTRAINT "InvoiceReminder_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvoiceReminder"
ADD CONSTRAINT "InvoiceReminder_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewRequest"
ADD CONSTRAINT "ReviewRequest_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewRequest"
ADD CONSTRAINT "ReviewRequest_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewRequest"
ADD CONSTRAINT "ReviewRequest_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReviewRequest"
ADD CONSTRAINT "ReviewRequest_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
