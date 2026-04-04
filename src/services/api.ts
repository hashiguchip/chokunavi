import { z } from "zod";
import { type ContactFormValues, WEB3FORMS_ENDPOINT } from "@/constants/contact";
import { env } from "@/env";
import { createHttpClient, Result } from "@/libs/http";

const http = createHttpClient();

// ---------------------------------------------------------------------------
// Schemas — single source of truth（型は z.infer で導出）
// ---------------------------------------------------------------------------

export const pricingDataSchema = z.object({
  rate: z.string(),
  billingHours: z.string(),
  trialRate: z.string(),
  trialNote: z.string(),
  patterns: z.array(
    z.object({
      label: z.string(),
      trialFlex: z.number(),
      trialPeriod: z.string(),
      regularFlex: z.number(),
      regularPeriod: z.string(),
    }),
  ),
});

export type PricingData = z.infer<typeof pricingDataSchema>;

const web3ResponseSchema = z.object({ success: z.boolean() });

// ---------------------------------------------------------------------------
// API Layer — URL + schema + options をバインドし、呼び出し側を簡潔にする
// ---------------------------------------------------------------------------

export const api = {
  /** 単価情報を取得する — 呼び出し前に pricing store でガード済み */
  pricing: (code: string) =>
    // biome-ignore lint/style/noNonNullAssertion: guarded by usePricingStore.fetchPricing
    http.get(env.NEXT_PUBLIC_PRICING_API_URL!, {
      schema: pricingDataSchema,
      headers: { "X-Referral-Code": code },
      retries: 2,
    }),

  /** お問い合わせフォームを送信する。provider が success: false を返した場合も http エラーに統合する */
  contact: async (body: ContactFormValues & { access_key: string }) => {
    const result = await http.post(WEB3FORMS_ENDPOINT, body, {
      schema: web3ResponseSchema,
    });
    if (result.ok && !result.data.success) {
      return Result.err({ type: "http", status: 200, message: "Submission rejected by provider" });
    }
    return result;
  },
};
