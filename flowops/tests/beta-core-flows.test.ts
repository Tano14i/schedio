import assert from "node:assert/strict";
import { evaluateLeadQualification } from "@/lib/lead-qualification";
import { canCreateJobFromProposalStatus, getThreadStatusAfterInbound, shouldConvertThreadToLead } from "@/lib/whatsapp-p0";
import { markViewedState, resolveEstimateDecision, sendEstimateState } from "@/lib/estimate-lifecycle";
import { markInvoicePaidState, sendInvoiceState, sendReviewRequestState } from "@/lib/invoice-lifecycle";

{
  const shouldConvert = shouldConvertThreadToLead({
    textMessageCount: 2,
    imageMessageCount: 1
  });
  assert.equal(shouldConvert, true);

  const nextThreadStatus = getThreadStatusAfterInbound({
    currentStatus: "WAITING_PHOTOS",
    messageType: "image",
    hasLead: true
  });
  assert.equal(nextThreadStatus, "WAITING_INTERNAL_APPROVAL");

  const qualification = evaluateLeadQualification({
    serviceType: "Riparazione tapparella",
    description: "Tapparella bloccata a meta corsa, serve sopralluogo e verifica cinghia.",
    address: "Via Verdi 7, Monza",
    photoCount: 2,
    measurements: "120x140 cm",
    jobSize: "small",
    budgetRange: "medium",
    serviceAreas: [{ id: "sa_1", companyId: "co_1", label: "Monza", city: "Monza", active: true }]
  });

  assert.equal(qualification.qualificationStatus, "qualified");
  assert.equal(qualification.nextBestAction, "propose_visit");
  assert.equal(canCreateJobFromProposalStatus("CUSTOMER_CONFIRMED"), true);
}

{
  const sentEstimate = sendEstimateState({ status: "draft" });
  assert.equal(sentEstimate.status, "sent");

  const viewedEstimate = markViewedState({
    status: sentEstimate.status,
    viewedAt: null
  });
  assert.equal(viewedEstimate.status, "viewed");

  const acceptedEstimate = resolveEstimateDecision("accept", {
    status: viewedEstimate.status,
    acceptedAt: null
  });
  assert.equal(acceptedEstimate.status, "accepted");
  assert.equal(acceptedEstimate.followUpCancelled, true);
}

{
  const sentInvoice = sendInvoiceState({ status: "draft" });
  assert.equal(sentInvoice.status, "sent");

  const paidInvoice = markInvoicePaidState({
    status: sentInvoice.status,
    paidAt: null
  });
  assert.equal(paidInvoice.status, "paid");
  assert.equal(paidInvoice.scheduleReviewRequest, true);

  const reviewRequest = sendReviewRequestState("pending");
  assert.equal(reviewRequest.status, "sent");
  assert.equal(reviewRequest.changed, true);
}

console.log("beta core flow tests passed");
