"use client";

import { useState } from "react";
import { DLRow } from "@/components/ui/DLRow";
import { trackPricingInterestClick } from "@/libs/analytics";
import { posthog } from "@/libs/posthog";
import { useAppDataStore } from "@/stores/app-data";

export function PricingRow() {
  const pricing = useAppDataStore((s) => s.data?.pricing);
  const [showInquiryPrompt, setShowInquiryPrompt] = useState(false);
  if (!pricing) return null;

  const handlePricingInterest = () => {
    setShowInquiryPrompt(true);
    trackPricingInterestClick("job_header");
    posthog.capture("pricing_interest_click", { location: "job_header" });
  };

  return (
    <DLRow label="単価">
      {showInquiryPrompt ? (
        <div>
          <div className="font-bold text-[15px] text-neutral-950">単価はお問い合わせください</div>
          <p className="mt-1 text-neutral-500 text-xs">ご相談内容にあわせて個別にご案内します。</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePricingInterest}
          className="inline-flex min-h-7 items-center rounded bg-neutral-950 px-3 py-1.5 font-bold text-[12px] text-white transition hover:bg-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          単価を見る
        </button>
      )}
    </DLRow>
  );
}
