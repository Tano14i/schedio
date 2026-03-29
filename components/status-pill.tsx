import type { EstimateStatus, InvoiceStatus, JobStatus, LeadStatus } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

export function StatusPill({
  status
}: {
  status: LeadStatus | JobStatus | EstimateStatus | InvoiceStatus;
}) {
  return <StatusBadge status={status} />;
}
