import { create } from "zustand";
import { env } from "@/env";
import { api, type PricingData } from "@/services/api";

export type { PricingData };

type PricingStore = {
  pricing: PricingData | null;
  loading: boolean;
  fetchPricing: (code: string) => Promise<void>;
};

export const usePricingStore = create<PricingStore>()((set) => ({
  pricing: null,
  loading: false,
  fetchPricing: async (code: string) => {
    if (!env.NEXT_PUBLIC_DATA_API_URL) return;
    set({ loading: true });
    const result = await api.pricing(code);
    set({ pricing: result.ok ? result.data : null, loading: false });
  },
}));
