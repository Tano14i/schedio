import assert from "node:assert/strict";
import {
  computeSimpleFunnelMetrics,
  followUpReasonForEstimate,
  shouldCreateAutomaticFollowUp,
  shouldSendDueFollowUp
} from "@/lib/estimate-followup-rules";

assert.equal(
  shouldCreateAutomaticFollowUp({ status: "sent", hasPendingFollowUp: false, isExpired: false }),
  true
);

assert.equal(
  shouldCreateAutomaticFollowUp({ status: "sent", hasPendingFollowUp: true, isExpired: false }),
  false
);

assert.equal(followUpReasonForEstimate(null), "no_view");
assert.equal(followUpReasonForEstimate("2026-03-27T10:00:00.000Z"), "viewed_not_accepted");

assert.equal(
  shouldSendDueFollowUp({
    followUpStatus: "scheduled",
    scheduledFor: "2026-03-27T08:00:00.000Z",
    now: "2026-03-27T10:00:00.000Z",
    estimateStatus: "sent"
  }),
  true
);

assert.equal(
  shouldSendDueFollowUp({
    followUpStatus: "scheduled",
    scheduledFor: "2026-03-27T08:00:00.000Z",
    now: "2026-03-27T10:00:00.000Z",
    estimateStatus: "expired"
  }),
  false
);

const metrics = computeSimpleFunnelMetrics({
  leadsReceived: 40,
  leadsQualified: 28,
  visitsConfirmed: 20,
  visitsCompleted: 16,
  estimatesCreated: 14,
  estimatesSent: 14,
  estimatesViewed: 9,
  estimatesAccepted: 5
});

assert.equal(metrics.estimatesAccepted, 5);
assert.equal(metrics.visitsCompleted, 16);

console.log("estimate follow-up P3 tests passed");
