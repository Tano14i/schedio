-- CreateIndex
CREATE INDEX "ActivityLog_companyId_createdAt_idx" ON "ActivityLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_entityId_idx" ON "ActivityLog"("companyId", "entityId");

-- CreateIndex
CREATE INDEX "Customer_companyId_createdAt_idx" ON "Customer"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Estimate_companyId_createdAt_idx" ON "Estimate"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Estimate_companyId_status_idx" ON "Estimate"("companyId", "status");

-- CreateIndex
CREATE INDEX "Invoice_companyId_createdAt_idx" ON "Invoice"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Invoice_companyId_status_idx" ON "Invoice"("companyId", "status");

-- CreateIndex
CREATE INDEX "Job_companyId_startAt_idx" ON "Job"("companyId", "startAt");

-- CreateIndex
CREATE INDEX "Job_companyId_status_idx" ON "Job"("companyId", "status");

-- CreateIndex
CREATE INDEX "Lead_companyId_createdAt_idx" ON "Lead"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_companyId_status_idx" ON "Lead"("companyId", "status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_companyId_createdAt_idx" ON "WhatsAppMessage"("companyId", "createdAt");
