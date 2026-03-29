import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function CardHeader({
  title,
  subtitle,
  aside
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
      </div>
      {aside}
    </div>
  );
}

export function CardContent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
