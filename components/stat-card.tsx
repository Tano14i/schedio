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
        "rounded-2xl border p-5 shadow-soft",
        accent === "sand"
          ? "border-primary-100 bg-primary-50"
          : "border-neutral-200 bg-white"
      )}
    >
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-neutral-600">{detail}</p>
    </article>
  );
}
