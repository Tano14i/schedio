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
      className={`rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_10px_30px_rgba(19,42,56,0.06)] sm:p-6 ${className ?? ""}`}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
