import type { EstimateStatus, InvoiceStatus, JobStatus, LeadStatus } from "@/lib/types";
import {
  estimateStatusMap,
  invoiceStatusMap,
  jobStatusMap,
  leadStatusMap
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type StatusValue = LeadStatus | JobStatus | EstimateStatus | InvoiceStatus;

const statusMeta: Record<StatusValue, { label: string; tone: string }> = {
  ...leadStatusMap,
  ...jobStatusMap,
  ...estimateStatusMap,
  ...invoiceStatusMap
};

export function StatusBadge({ status }: { status: StatusValue }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        meta.tone
      )}
    >
      {meta.label}
    </span>
  );
}
