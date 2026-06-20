import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
