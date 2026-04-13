import { apiClient } from "./client";
import type { components } from "./schema.generated";

// 生成された OpenAPI schema から型を直接派生させる。
// huma 側の operation 定義 → openapi.yaml → schema.generated.ts と
// 単一経路で contract が伝搬するため、サーバの response 型を frontend が
// 二重定義する必要がない。
export type AppData = components["schemas"]["AppData"];
export type Project = components["schemas"]["Project"];
export type Pricing = components["schemas"]["Pricing"];
export type Settings = components["schemas"]["Settings"];

/**
 * /api/app-data からアプリデータを取得する。X-Referral-Code を header に載せる。
 *
 * - Result<AppData> を返し、呼び出し側は ok フラグで分岐する
 * - GET 失敗時は apiClient の retry 設定に従う (network/timeout のみ retry)
 */
export const getAppData = (code: string) =>
  apiClient.get<AppData>("/api/app-data", {
    headers: { "X-Referral-Code": code },
  });
