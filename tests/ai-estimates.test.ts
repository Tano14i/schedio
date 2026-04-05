import assert from "node:assert/strict";
import { buildEstimateAiAssist } from "@/lib/ai-estimates";

(async () => {
  {
    const assist = await buildEstimateAiAssist({
      title: "Riparazione tapparella",
      scopeSummary: "Tapparella bloccata con possibile cambio cinghia",
      notes: "Il cliente chiede intervento rapido",
      serviceType: "Riparazione tapparella",
      items: [{ label: "Intervento tapparella", qty: 1, unitPrice: 120 }],
      laborCost: 95,
      materialCost: 40,
      otherCost: 0
    });

    assert.equal(assist.currentTotal, 120);
    assert.equal(assist.trackedCost, 135);
    assert.ok((assist.recommendedMinimumTotal ?? 0) > assist.currentTotal);
    assert.ok(assist.alerts.some((alert) => alert.severity === "high"));
  }

  {
    const assist = await buildEstimateAiAssist({
      title: "Montaggio mensole",
      scopeSummary: "Tre mensole su cartongesso",
      notes: "Tasselli inclusi",
      serviceType: "Montaggio mensole",
      items: [],
      laborCost: 60,
      materialCost: 20,
      otherCost: 15
    });

    assert.ok(assist.suggestedItems.length > 0);
    assert.ok(assist.suggestedTotal > 0);
    assert.equal(assist.materialCost, 20);
  }

  console.log("ai estimates tests passed");
})();
