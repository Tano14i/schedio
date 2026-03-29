import assert from "node:assert/strict";
import {
  ensureDraftIdempotent,
  markViewedState,
  resolveEstimateDecision,
  sendEstimateState,
  shouldScheduleEstimateFollowUp
} from "@/lib/estimate-lifecycle";

{
  const result = ensureDraftIdempotent("est_1");
  assert.equal(result.shouldCreate, false);
  assert.equal(result.estimateId, "est_1");
}

{
  const result = sendEstimateState({ status: "draft" });
  assert.equal(result.status, "sent");
  assert.equal(result.sentAt, "now");
  assert.equal(result.publicToken, "generate");
}

{
  const result = markViewedState({ status: "sent" });
  assert.equal(result.status, "viewed");
  assert.equal(result.changed, true);
}

{
  const result = markViewedState({ status: "viewed", viewedAt: "2026-03-27T10:00:00.000Z" });
  assert.equal(result.status, "viewed");
  assert.equal(result.changed, false);
}

{
  const result = resolveEstimateDecision("accept", { status: "sent" });
  assert.equal(result.status, "accepted");
  assert.equal(result.followUpCancelled, true);
}

{
  const result = resolveEstimateDecision("reject", { status: "viewed" });
  assert.equal(result.status, "rejected");
  assert.equal(result.followUpCancelled, true);
}

{
  assert.equal(
    shouldScheduleEstimateFollowUp({ status: "sent" }),
    true
  );
  assert.equal(
    shouldScheduleEstimateFollowUp({ status: "accepted", acceptedAt: "2026-03-27T10:00:00.000Z" }),
    false
  );
}

console.log("estimate lifecycle tests passed");
