import assert from "node:assert/strict";
import {
  canCreateJobFromProposalStatus,
  getThreadStatusAfterInbound,
  shouldConvertThreadToLead
} from "@/lib/whatsapp-p0";

assert.equal(
  shouldConvertThreadToLead({
    leadId: "lead_123",
    textMessageCount: 2,
    imageMessageCount: 1
  }),
  false
);

assert.equal(
  shouldConvertThreadToLead({
    textMessageCount: 1,
    imageMessageCount: 1
  }),
  true
);

assert.equal(
  shouldConvertThreadToLead({
    textMessageCount: 1,
    imageMessageCount: 0
  }),
  false
);

assert.equal(
  getThreadStatusAfterInbound({
    currentStatus: "WAITING_PHOTOS",
    messageType: "image",
    hasLead: true
  }),
  "WAITING_INTERNAL_APPROVAL"
);

assert.equal(canCreateJobFromProposalStatus("PENDING_HANDYMAN_APPROVAL"), false);
assert.equal(canCreateJobFromProposalStatus("SENT_TO_CUSTOMER"), false);
assert.equal(canCreateJobFromProposalStatus("CUSTOMER_CONFIRMED"), true);

console.log("WhatsApp P0 tests passed.");
