import assert from "node:assert/strict";
import { calculateJobCosts, calculateJobFinancialSummary } from "@/lib/job-financials";

{
  const totalCost = calculateJobCosts([
    { qty: 2, unitCost: 35 },
    { qty: 1.5, unitCost: 40 }
  ]);

  assert.equal(totalCost, 130);
}

{
  const summary = calculateJobFinancialSummary({
    costs: [
      { qty: 2, unitCost: 35 },
      { qty: 1, unitCost: 50 },
      { qty: 1.5, unitCost: 28 }
    ],
    revenue: {
      estimateTotal: 280,
      invoiceTotal: 0
    }
  });

  assert.equal(summary.expectedRevenue, 280);
  assert.equal(summary.totalCost, 162);
  assert.equal(summary.margin, 118);
  assert.equal(summary.marginRate, 42.1);
}

{
  const summary = calculateJobFinancialSummary({
    costs: [{ qty: 1, unitCost: 300 }],
    revenue: {
      estimateTotal: 200,
      invoiceTotal: null
    }
  });

  assert.equal(summary.margin, -100);
  assert.equal(summary.marginRate, -50);
}

console.log("job financial tests passed");
