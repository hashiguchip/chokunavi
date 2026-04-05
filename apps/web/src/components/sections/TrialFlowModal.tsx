"use client";

import { X } from "lucide-react";
import { closeModal } from "@/libs/global-modal";
import { usePricingStore } from "@/stores/pricing";

export function TrialFlowModal() {
  const pricing = usePricingStore((s) => s.pricing);

  if (!pricing) return null;

  return (
    <div role="dialog" aria-modal="true" className="w-[calc(100vw-24px)] max-w-2xl rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-[#eee] border-b px-5 py-4">
        <h2 className="font-bold text-[#333] text-[16px]">トライアルの流れ</h2>
        <button
          type="button"
          onClick={closeModal}
          className="rounded p-1 text-[#999] transition hover:bg-[#f5f5f5] hover:text-[#666]"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        {pricing.patterns.map((p) => (
          <div key={p.label}>
            <p className="mb-2 font-bold text-[#555] text-[13px]">{p.label}の場合</p>
            <div className="flex items-center gap-0.5">
              <div className="flex flex-1 gap-0.5">
                <div
                  className="rounded border border-[#FF6633]/30 bg-[#FF6633]/10 px-2 py-2 text-center"
                  style={{ flex: p.trialFlex }}
                >
                  <p className="font-bold text-[#FF6633] text-[13px]">{pricing.trialRate}/月</p>
                  <p className="mt-0.5 text-[#FF6633]/70 text-[10px]">{p.trialPeriod}</p>
                  <p className="text-[#FF6633]/70 text-[10px]">(トライアル)</p>
                </div>
                <div
                  className="rounded border border-primary-500/30 bg-primary-500/10 px-2 py-2 text-center"
                  style={{ flex: p.regularFlex }}
                >
                  <p className="font-bold text-[13px] text-primary-700">{pricing.rate}/月</p>
                  <p className="mt-0.5 text-[10px] text-primary-700/70">{p.regularPeriod}</p>
                </div>
              </div>
              <span className="text-[#999] text-[16px]">→</span>
            </div>
          </div>
        ))}

        <p className="text-[#999] text-[11px]">※ トライアル期間は{pricing.trialNote}</p>
      </div>
    </div>
  );
}
