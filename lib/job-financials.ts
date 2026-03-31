type JobCostInput = {
  qty: number;
  unitCost: number;
};

type JobRevenueInput = {
  estimateTotal?: number | null;
  invoiceTotal?: number | null;
};

export function calculateJobCosts(items: JobCostInput[]) {
  return Number(
    items.reduce((sum, item) => sum + normalizeNumber(item.qty) * normalizeNumber(item.unitCost), 0).toFixed(2)
  );
}

export function calculateJobFinancialSummary(input: {
  costs: JobCostInput[];
  revenue: JobRevenueInput;
}) {
  const estimatedRevenue = normalizeNumber(input.revenue.estimateTotal);
  const invoicedRevenue = normalizeNumber(input.revenue.invoiceTotal);
  const totalCost = calculateJobCosts(input.costs);
  const expectedRevenue = invoicedRevenue || estimatedRevenue;
  const margin = Number((expectedRevenue - totalCost).toFixed(2));
  const marginRate =
    expectedRevenue > 0 ? Number(((margin / expectedRevenue) * 100).toFixed(1)) : null;

  return {
    estimatedRevenue,
    invoicedRevenue,
    expectedRevenue,
    totalCost,
    margin,
    marginRate
  };
}

function normalizeNumber(value?: number | null) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}
