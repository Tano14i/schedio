import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { typography } from "@/lib/design-tokens";

type Action = {
  label: string;
  href: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: Action;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <h1 className={`${typography.h2} text-ink text-[1.75rem] leading-[1.05] sm:text-4xl md:text-5xl`}>
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-600 sm:text-sm">{description}</p>
        </div>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-600 sm:w-auto"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
