"use client";

import { X } from "lucide-react";
import { closeModal } from "@/libs/global-modal";
import { usePricingStore } from "@/stores/pricing";

export function TrialFlowModal() {
  const pricing = usePricingStore((s) => s.pricing);

  if (!pricing) return null;

  return (
    <div role="dialog" aria-modal="true" className="w-[calc(100vw-24px)] max-w-2xl rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-neutral-200 border-b px-5 py-4">
        <h2 className="font-bold text-base text-neutral-950">トライアルの流れ</h2>
        <button
          type="button"
          onClick={closeModal}
          className="rounded p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        {pricing.patterns.map((p) => (
          <div key={p.label}>
            <p className="mb-2 font-bold text-[13px] text-neutral-800">{p.label}の場合</p>
            <div className="flex items-center gap-0.5">
              <div className="flex flex-1 gap-0.5">
                <div
                  className="rounded border border-accent-trial/30 bg-accent-trial/10 px-2 py-2 text-center"
                  style={{ flex: p.trialFlex }}
                >
                  <p className="font-bold text-[13px] text-accent-trial">{pricing.trialRate}/月</p>
                  <p className="mt-0.5 text-[10px] text-accent-trial/70">{p.trialPeriod}</p>
                  <p className="text-[10px] text-accent-trial/70">(トライアル)</p>
                </div>
                <div
                  className="rounded border border-primary-500/30 bg-primary-500/10 px-2 py-2 text-center"
                  style={{ flex: p.regularFlex }}
                >
                  <p className="font-bold text-[13px] text-primary-700">{pricing.rate}/月</p>
                  <p className="mt-0.5 text-[10px] text-primary-700/70">{p.regularPeriod}</p>
                </div>
              </div>
              <span className="text-base text-neutral-500">→</span>
            </div>
          </div>
        ))}

        <p className="text-[11px] text-neutral-500">※ トライアル期間は{pricing.trialNote}</p>
      </div>
    </div>
  );
}
