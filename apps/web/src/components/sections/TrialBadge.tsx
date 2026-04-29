"use client";

import { Info } from "lucide-react";
import { showPopover } from "@/libs/global-popover";
import { useAppDataStore } from "@/stores/app-data";

export function TrialBadge() {
  const pricing = useAppDataStore((s) => s.data?.pricing);

  if (!pricing || pricing.trialRate === pricing.rate) return null;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    showPopover({
      content: (
        <>
          <p>トライアルの詳細は面談時にご案内します。</p>
          <p className="mt-1 text-neutral-400">まずは気軽にご相談ください。</p>
        </>
      ),
      anchor: e.currentTarget,
      position: "bottom",
    });
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
      </span>
      <Info size={14} className="shrink-0 opacity-60" />
    </button>
  );
}
