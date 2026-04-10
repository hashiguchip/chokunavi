"use client";

import { DLRow } from "@/components/ui/DLRow";
import { useAppDataStore } from "@/stores/app-data";
import { TrialBadge } from "./TrialBadge";

export function PricingRow() {
  const pricing = useAppDataStore((s) => s.data?.pricing);
  if (!pricing) return null;

  return (
    <DLRow label="単価">
      <div>
        <div className="font-bold text-[15px] text-neutral-950">
          {pricing.rate} / 月<span className="ml-0.5 font-normal text-[11px] text-neutral-500">（税別）</span>
          <span className="ml-1 font-normal text-neutral-500 text-xs">（精算 {pricing.billingHours}）</span>
        </div>
        <TrialBadge />
      </div>
    </DLRow>
  );
}
