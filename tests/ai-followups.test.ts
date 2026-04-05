import assert from "node:assert/strict";
import {
  buildEstimateFollowUpAiAssist,
  buildInvoiceReminderAiAssist,
  buildReviewRequestAiAssist
} from "@/lib/ai-followups";

(async () => {
  {
    const assist = await buildEstimateFollowUpAiAssist({
      customerName: "Mario Rossi",
      title: "Preventivo tapparella",
      total: 280,
      publicUrl: "https://schedio.test/public/estimates/demo-1",
      viewedAt: null,
      reason: "no_view"
    });

    assert.equal(assist.scenario, "not_viewed");
    assert.equal(assist.recommendation, "follow_up_now");
    assert.match(assist.message, /Preventivo tapparella/i);
    assert.match(assist.message, /schedio\.test/i);
  }

  {
    const assist = await buildEstimateFollowUpAiAssist({
      customerName: "Laura Bianchi",
      title: "Preventivo cucina",
      total: 950,
      publicUrl: "https://schedio.test/public/estimates/demo-2",
      viewedAt: new Date().toISOString(),
      reason: "viewed_not_accepted"
    });

    assert.equal(assist.scenario, "viewed_not_accepted");
    assert.equal(assist.recommendation, "call_customer");
    assert.match(assist.summary, /gia aperto|già aperto/i);
  }

  {
    const assist = await buildInvoiceReminderAiAssist({
      customerName: "Giulia Neri",
      invoiceNumber: "INV-2026-003",
      total: 420,
      publicUrl: "https://schedio.test/public/invoices/demo-1",
      reason: "overdue"
    });

    assert.equal(assist.scenario, "overdue");
    assert.equal(assist.recommendation, "send_reminder");
    assert.match(assist.message, /INV-2026-003/);
    assert.match(assist.message, /420/);
  }

  {
    const assist = await buildReviewRequestAiAssist({
      customerName: "Marco Sala",
      reviewLink: "https://g.page/r/demo-review-link",
      workSummary: "riparazione tapparella"
    });

    assert.match(assist.message, /recensione/i);
    assert.match(assist.message, /riparazione tapparella/i);
  }

  console.log("ai followups tests passed");
})();
