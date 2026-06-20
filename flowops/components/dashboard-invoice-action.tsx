"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/button";

export function DashboardInvoiceAction({
  invoiceId,
  recommendation
}: {
  invoiceId: string;
  recommendation: "send_invoice" | "send_reminder" | "mark_paid" | "send_review";
}) {
  const router = useRouter();

  async function run() {
    if (recommendation === "send_reminder") {
      await fetch(`/api/invoices/${invoiceId}/schedule-reminder`, { method: "POST" });
      await fetch("/api/internal/invoice-reminders/run", { method: "POST" });
    } else if (recommendation === "mark_paid") {
      await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
    }

    router.refresh();
  }

  if (recommendation === "send_invoice") {
    return null;
  }

  return (
    <Button type="button" size="md" variant="secondary" className="w-full sm:w-auto" onClick={run}>
      {recommendation === "send_reminder" ? "Sollecita ora" : recommendation === "mark_paid" ? "Segna pagata" : "Invia review"}
    </Button>
  );
}
