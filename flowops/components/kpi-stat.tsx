import { StatCard } from "@/components/stat-card";

export function KPIStat({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return <StatCard label={label} value={value} detail={detail} />;
}
