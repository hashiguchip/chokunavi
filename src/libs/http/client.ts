import { type HttpClient, type HttpClientConfig, type RequestOptions, Result } from "./types";

const DEFAULT_TIMEOUT = 10_000;

type Method = "GET" | "POST";

/** 単一リクエストを実行し、Result<T> を返す。この関数は例外を throw しない */
async function execute<T>(
  method: Method,
  url: string,
  body: unknown,
  config: HttpClientConfig,
  options?: RequestOptions<T>,
): Promise<Result<T>> {
  const timeout = options?.timeout ?? config.timeout ?? DEFAULT_TIMEOUT;
  const timeoutSignal = AbortSignal.timeout(timeout);
  const signal = options?.signal ? AbortSignal.any([timeoutSignal, options.signal]) : timeoutSignal;

  const headers: Record<string, string> = {
    ...config.headers,
    ...options?.headers,
  };

  // Content-Type は body がある場合のみ付与（GET に付けない）
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  // --- fetch ---
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl ?? ""}${url}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    // 合成シグナルの reason で最初に発火した原因を正確に判別する
    if (signal.aborted) {
      const isTimeout = signal.reason instanceof DOMException && signal.reason.name === "TimeoutError";
      if (isTimeout) {
        return Result.err({
          type: "timeout",
          message: `Request timed out after ${timeout}ms`,
        });
      }
      return Result.err({ type: "abort", message: "Request was cancelled" });
    }
    return Result.err({ type: "network", message: "Network error" });
  }

  // --- HTTP ステータス ---
  if (!res.ok) {
    return Result.err({
      type: "http",
      status: res.status,
      message: `HTTP ${res.status} ${res.statusText}`,
    });
  }

  // --- 204 No Content ---
  if (res.status === 204) {
    return Result.err({ type: "no-content", message: "No content (HTTP 204)" });
  }

  // --- レスポンスボディ読み取り ---
  let text: string;
  try {
    text = await res.text();
  } catch {
    return Result.err({
      type: "network",
      message: "Failed to read response body",
    });
  }

  // --- JSON パース ---
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return Result.err({
      type: "parse",
      message: "Response is not valid JSON",
    });
  }

  // --- Zod スキーマ検証（schema が渡された場合のみ） ---
  if (options?.schema) {
    const parsed = options.schema.safeParse(data);
    if (!parsed.success) {
      return Result.err({ type: "parse", message: parsed.error.message });
    }
    return Result.ok(parsed.data);
  }

  // schema なしの場合は as T（escape hatch）
  return Result.ok(data as T);
}

/**
 * リトライ付きでリクエストを実行する。
 *
 * - POST は冪等でないためリトライしない（二重送信防止）
 * - network / timeout のみリトライ対象（http / parse はサーバー側の問題でありリトライしても結果が変わらない）
 * - exponential backoff: 1s → 2s → 4s ...
 */
async function withRetry<T>(
  method: Method,
  url: string,
  body: unknown,
  config: HttpClientConfig,
  options?: RequestOptions<T>,
): Promise<Result<T>> {
  const retries = options?.retries ?? config.retries ?? 0;

  if (method !== "GET" || retries <= 0) {
    return execute(method, url, body, config, options);
  }

  let result = await execute<T>(method, url, body, config, options);

  for (let attempt = 0; attempt < retries && !result.ok; attempt++) {
    const errorType = result.error.type;
    if (errorType !== "network" && errorType !== "timeout") break;

    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    result = await execute(method, url, body, config, options);
  }

  return result;
}

/** HTTP クライアントを生成する factory */
export function createHttpClient(config: HttpClientConfig = {}) {
  return {
    get: <T>(url: string, options?: RequestOptions<T>) => withRetry<T>("GET", url, undefined, config, options),
    post: <T>(url: string, body: unknown, options?: RequestOptions<T>) =>
      withRetry<T>("POST", url, body, config, options),
  } satisfies HttpClient;
}
