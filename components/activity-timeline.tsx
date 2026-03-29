import type { ActivityLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function ActivityTimeline({ items }: { items: ActivityLog[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="mt-1 h-3 w-3 rounded-full bg-primary-500" />
          <div>
            <p className="text-sm font-medium text-ink">{item.message}</p>
            <p className="text-xs text-neutral-500">{formatDateTime(item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
