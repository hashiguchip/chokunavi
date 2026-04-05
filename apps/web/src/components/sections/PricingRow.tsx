"use client";

import { DLRow } from "@/components/ui/DLRow";
import { usePricingStore } from "@/stores/pricing";
import { TrialBadge } from "./TrialBadge";

export function PricingRow() {
  const pricing = usePricingStore((s) => s.pricing);
  if (!pricing) return null;

  return (
    <DLRow label="単価">
      <div>
        <div className="font-bold text-[#333] text-[15px]">
          {pricing.rate} / 月<span className="ml-0.5 font-normal text-[#999] text-[11px]">（税別）</span>
          <span className="ml-1 font-normal text-[#999] text-[12px]">（精算 {pricing.billingHours}）</span>
        </div>
        <TrialBadge />
      </div>
    </DLRow>
  );
}
