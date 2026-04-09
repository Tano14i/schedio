import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { typography } from "@/lib/design-tokens";

type Action =
  | { label: string; href: string; onClick?: never; dataTour?: string }
  | { label: string; onClick: () => void; href?: never; dataTour?: string };

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
  const actionClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-600 sm:w-auto";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2.5">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-600">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className={`${typography.h2} text-ink text-2xl leading-tight sm:text-[2.55rem] md:text-[3.1rem]`}>
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-600 sm:text-[15px]">{description}</p>
        </div>
      </div>
      {action ? (
        action.href ? (
          <Link
            href={action.href}
            data-tour={action.dataTour}
            className={actionClass}
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            data-tour={action.dataTour}
            onClick={action.onClick}
            className={actionClass}
          >
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </button>
        )
      ) : null}
    </div>
  );
}
