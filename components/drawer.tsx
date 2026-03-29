import type { ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function Drawer({
  title,
  description,
  closeHref,
  children
}: {
  title: string;
  description: string;
  closeHref: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-900/40 backdrop-blur-sm">
      <Link href={closeHref} className="flex-1" aria-label="Chiudi drawer" />
      <div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-neutral-200 bg-white shadow-panel">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          </div>
          <Link
            href={closeHref}
            className="rounded-xl border border-neutral-200 p-2 text-neutral-500 transition hover:bg-neutral-50"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
