"use client";

import { useTransition } from "react";
import { Button } from "@/components/button";

export function DashboardFollowUpAction({
  estimateId,
  recommendation
}: {
  estimateId: string;
  recommendation: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (recommendation !== "follow_up_now" && recommendation !== "wait") {
    return null;
  }

  function handleClick() {
    startTransition(async () => {
      await fetch(
        recommendation === "follow_up_now"
          ? `/api/estimates/${estimateId}/send-follow-up-now`
          : `/api/estimates/${estimateId}/snooze-follow-up`,
        { method: "POST" }
      );
      window.location.reload();
    });
  }

  return (
    <Button variant="secondary" size="md" className="w-full sm:w-auto" disabled={isPending} onClick={handleClick}>
      {recommendation === "follow_up_now" ? "Invia follow-up ora" : "Posticipa follow-up"}
    </Button>
  );
}
