import assert from "node:assert/strict";
import {
  markInvoicePaidState,
  markInvoiceViewedState,
  sendInvoiceState,
  sendReviewRequestState,
  shouldScheduleInvoiceReminder,
  shouldScheduleReviewRequest,
  shouldSendInvoiceReminder
} from "@/lib/invoice-lifecycle";

{
  const result = sendInvoiceState({ status: "draft" });
  assert.equal(result.sentAt, "now");
  assert.equal(result.publicToken, "generate");
  assert.equal(result.status, "sent");
}

{
  const result = markInvoiceViewedState({ status: "sent" });
  assert.equal(result.changed, true);
  assert.equal(result.viewedAt, "now");
}

{
  const result = markInvoiceViewedState({
    status: "sent",
    viewedAt: "2026-03-27T10:00:00.000Z"
  });
  assert.equal(result.changed, false);
}

{
  const result = markInvoicePaidState({ status: "sent" });
  assert.equal(result.status, "paid");
  assert.equal(result.reminderCancelled, true);
  assert.equal(result.scheduleReviewRequest, true);
}

{
  assert.equal(
    shouldScheduleInvoiceReminder({
      status: "sent",
      dueDate: "2026-03-30T00:00:00.000Z"
    }),
    true
  );
  assert.equal(
    shouldScheduleInvoiceReminder({
      status: "paid",
      dueDate: "2026-03-30T00:00:00.000Z",
      paidAt: "2026-03-29T12:00:00.000Z"
    }),
    false
  );
}

{
  assert.equal(
    shouldSendInvoiceReminder({
      status: "sent",
      dueDate: "2026-03-30T00:00:00.000Z"
    }),
    true
  );
  assert.equal(
    shouldSendInvoiceReminder({
      status: "void",
      dueDate: "2026-03-30T00:00:00.000Z"
    }),
    false
  );
}

{
  assert.equal(
    shouldScheduleReviewRequest({
      status: "paid",
      paidAt: "2026-03-29T12:00:00.000Z"
    }),
    true
  );
  assert.equal(
    shouldScheduleReviewRequest({
      status: "sent"
    }),
    false
  );
}

{
  const result = sendReviewRequestState("pending");
  assert.equal(result.status, "sent");
  assert.equal(result.changed, true);
}

{
  const result = sendReviewRequestState("sent");
  assert.equal(result.changed, false);
}

console.log("invoice lifecycle P4 tests passed");
