import type { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  children,
  aside,
  className
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft sm:p-5 ${className ?? ""}`}
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink sm:text-lg">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-neutral-600">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
