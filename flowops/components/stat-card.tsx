import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  accent
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "brand" | "sand";
}) {
  return (
    <article
      className={cn(
        "rounded-3xl border p-5 shadow-[0_10px_30px_rgba(19,42,56,0.05)]",
        accent === "sand"
          ? "border-primary-100 bg-primary-50/80"
          : "border-slate-200/90 bg-white"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{detail}</p>
    </article>
  );
}
