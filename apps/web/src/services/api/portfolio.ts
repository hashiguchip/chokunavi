import { createHttpClient } from "@/libs/http";
import type { components } from "./schema.generated";

// 生成された OpenAPI schema から型を直接派生させる。
// huma 側の operation 定義 → openapi.yaml → schema.generated.ts と
// 単一経路で contract が伝搬するため、サーバの response 型を frontend が
// 二重定義する必要がない。
export type Portfolio = components["schemas"]["Portfolio"];

const http = createHttpClient();

// PR 3 時点では frontend のどこからも呼ばれない (PR 4 で usePortfolioStore から接続)。
// ここでは「型が flow し、call shape が pricing() と同じ」ことを確認するための
// 雛形にとどめる。base URL の構築は PR 4 で env と一緒に再考する。
const PORTFOLIO_URL = "/api/portfolio";

/**
 * /api/portfolio を取得する。pricing() と同じく X-Referral-Code を header に載せる。
 *
 * - Result<Portfolio> を返し、呼び出し側は ok フラグで分岐する
 * - GET 失敗時は libs/http の retry 設定に従う (network/timeout のみ retry)
 */
export const getPortfolio = (code: string) =>
  http.get<Portfolio>(PORTFOLIO_URL, {
    headers: { "X-Referral-Code": code },
    retries: 2,
  });
