import { env } from "@/env";
import { createHttpClient } from "@/libs/http";

/**
 * Internal API client — data API 向けの共有インスタンス。
 * baseUrl / Accept / retries をここで一元管理する。
 */
export const apiClient = createHttpClient({
  baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    Accept: "application/json, application/problem+json",
  },
  retries: 2,
});
