"use client";

import { Info } from "lucide-react";
import { openModal } from "@/libs/global-modal";
import { usePricingStore } from "@/stores/pricing";
import { TrialFlowModal } from "./TrialFlowModal";

export function TrialBadge() {
  const pricing = usePricingStore((s) => s.pricing);

  if (!pricing) return null;

  const handleClick = () => {
    openModal(TrialFlowModal);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded bg-accent-trial/10 px-2.5 py-1 text-accent-trial text-xs leading-tight transition hover:bg-accent-trial/20"
    >
      <span>
        <span className="font-bold">トライアル:</span> 最初の更新月まで{" "}
        <span className="font-bold">{pricing.trialRate}</span> でお試しいただけます
        <span className="ml-1 font-normal text-[11px]">（{pricing.trialNote}）</span>
      </span>
      <Info size={14} className="shrink-0 opacity-60" />
    </button>
  );
}
