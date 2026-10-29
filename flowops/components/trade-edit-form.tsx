import { CompanyFieldForm } from "@/components/company-field-form";

export function TradeEditForm({ currentTrade }: { currentTrade: string | null }) {
  return (
    <CompanyFieldForm
      field="trade"
      label="Mestiere / specializzazione"
      currentValue={currentTrade}
      placeholder="es. Idraulico, Elettricista, Muratore..."
    />
  );
}
