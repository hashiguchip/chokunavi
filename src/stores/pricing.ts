import { create } from "zustand";
import { env } from "@/env";

type TrialPattern = {
  label: string;
  trialFlex: number;
  trialPeriod: string;
  regularFlex: number;
  regularPeriod: string;
};

export type PricingData = {
  /** メイン単価 */
  rate: string;
  /** 精算幅（例: "140〜180h / 月"） */
  billingHours: string;
  /** トライアル単価 */
  trialRate: string;
  /** トライアル期間の説明（例: "1〜3ヶ月で選択可"） */
  trialNote: string;
  /** モーダル内のシナリオパターン */
  patterns: TrialPattern[];
};

type PricingStore = {
  pricing: PricingData | null;
  loading: boolean;
  fetchPricing: (code: string) => Promise<void>;
};

export const usePricingStore = create<PricingStore>()((set) => ({
  pricing: null,
  loading: false,
  fetchPricing: async (code: string) => {
    const apiUrl = env.NEXT_PUBLIC_PRICING_API_URL;
    if (!apiUrl) return;

    set({ loading: true });
    try {
      const res = await fetch(apiUrl, {
        headers: { "X-Referral-Code": code },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PricingData = await res.json();
      set({ pricing: data, loading: false });
    } catch {
      set({ pricing: null, loading: false });
    }
  },
}));
