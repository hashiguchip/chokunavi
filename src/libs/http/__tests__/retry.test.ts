import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@/libs/http";

const mockFetch = vi.fn<typeof globalThis.fetch>();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("withRetry (via createHttpClient)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const http = createHttpClient({ baseUrl: "https://api.test", retries: 3 });

  it("retries GET on network error and succeeds", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(jsonResponse({ ok: true }));

    const promise = http.get("/test");
    await vi.advanceTimersByTimeAsync(1000); // 1st backoff: 2^0 * 1000
    const result = await promise;

    expect(result).toEqual({ ok: true, data: { ok: true } });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries GET on timeout error and succeeds", async () => {
    const timeoutError = new DOMException("Signal timed out", "TimeoutError");
    const abortedSignal = AbortSignal.abort(timeoutError);
    const normalSignal = AbortSignal.timeout(10_000); // spy の前に本物を呼ぶ

    vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(abortedSignal).mockReturnValue(normalSignal);

    // 1回目: signal が既に abort 済み → fetch が即 reject → timeout error
    mockFetch
      .mockImplementationOnce((_url, init) => {
        const signal = (init as RequestInit).signal as AbortSignal;
        return Promise.reject(signal.aborted ? signal.reason : new Error("unexpected"));
      })
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const promise = http.get("/test");
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toEqual({ ok: true, data: { ok: true } });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry GET on http error", async () => {
    mockFetch.mockResolvedValue(new Response("", { status: 500, statusText: "Internal Server Error" }));

    const result = await http.get("/test");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("http");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry GET on parse error", async () => {
    mockFetch.mockResolvedValue(new Response("not json", { status: 200 }));

    const result = await http.get("/test");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("parse");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("never retries POST even on network error", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await http.post("/submit", { data: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("network");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("uses exponential backoff: 1s, 2s, 4s", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const promise = http.get("/test");

    // initial call (immediate) → 1 call
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // 1st retry after 1000ms (2^0 * 1000)
    await vi.advanceTimersByTimeAsync(999);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 2nd retry after 2000ms (2^1 * 1000)
    await vi.advanceTimersByTimeAsync(1999);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // 3rd retry after 4000ms (2^2 * 1000)
    await vi.advanceTimersByTimeAsync(3999);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(4);

    await promise;
  });

  it("exhausts retries and returns last error", async () => {
    const client = createHttpClient({ baseUrl: "https://api.test", retries: 2 });
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const promise = client.get("/test");
    // 2^0*1000 + 2^1*1000 = 3000ms で全リトライ消化
    await vi.advanceTimersByTimeAsync(3000);
    const result = await promise;

    expect(result).toEqual({
      ok: false,
      error: { type: "network", message: "Network error" },
    });
    // initial + 2 retries = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
