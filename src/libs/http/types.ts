import type { z } from "zod";

// ---------------------------------------------------------------------------
// Result<T> — try/catch 不要の型安全エラーハンドリング
// ---------------------------------------------------------------------------

/** 成功 or 失敗を表す判別共用体。ok フラグで TypeScript が自動 narrowing する */
export type Result<T> = { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: HttpError };

/**
 * Result のファクトリ関数とユーティリティ。
 *
 * declaration merging により `Result` は型としても値としても使える:
 * - 型: `Result<T>` — 関数の戻り値型として使用
 * - 値: `Result.ok(data)` — インスタンスの生成やユーティリティの呼び出し
 */
export const Result = {
  /** 成功値を包む */
  ok: <T>(data: T): Result<T> => ({ ok: true, data }),

  /** エラーを包む */
  err: (error: HttpError): Result<never> => ({ ok: false, error }),

  /** 成功値を変換する。失敗時はそのまま返す */
  map: <T, U>(result: Result<T>, fn: (data: T) => U): Result<U> => (result.ok ? Result.ok(fn(result.data)) : result),

  /** エラーを変換する。成功時はそのまま返す */
  mapError: <T>(result: Result<T>, fn: (error: HttpError) => HttpError): Result<T> =>
    result.ok ? result : Result.err(fn(result.error)),

  /**
   * 成功時は data を、失敗時は fallback を返す。
   * `NoInfer<T>` により fallback が T を widening するのを防ぐ（TS 5.4+）
   */
  unwrapOr: <T>(result: Result<T>, fallback: NoInfer<T>): T => (result.ok ? result.data : fallback),

  /** 成功・失敗それぞれのハンドラで処理する */
  match: <T, U>(result: Result<T>, handlers: { ok: (data: T) => U; err: (error: HttpError) => U }): U =>
    result.ok ? handlers.ok(result.data) : handlers.err(result.error),
} as const;

// ---------------------------------------------------------------------------
// HttpError — 判別共用体によるエラー分類
// ---------------------------------------------------------------------------

export type HttpError =
  | { readonly type: "network"; readonly message: string }
  | { readonly type: "timeout"; readonly message: string }
  | { readonly type: "http"; readonly status: number; readonly message: string }
  | { readonly type: "parse"; readonly message: string }
  | { readonly type: "abort"; readonly message: string }
  | { readonly type: "no-content"; readonly message: string };

// ---------------------------------------------------------------------------
// HTTP Client 型
// ---------------------------------------------------------------------------

/** クライアント設定 */
export type HttpClientConfig = {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
};

/**
 * リクエスト固有オプション。
 *
 * `schema` を渡すとレスポンスを Zod でランタイム検証し、T が自動推論される。
 * 渡さない場合は呼び出し側が `<T>` を手動指定する（escape hatch）。
 */
export type RequestOptions<T = unknown> = {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  schema?: z.ZodType<T>;
};

/** HTTP クライアント */
export type HttpClient = {
  get: <T>(url: string, options?: RequestOptions<T>) => Promise<Result<T>>;
  post: <T>(url: string, body: unknown, options?: RequestOptions<T>) => Promise<Result<T>>;
};
