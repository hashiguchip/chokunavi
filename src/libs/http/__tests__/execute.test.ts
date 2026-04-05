import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createHttpClient } from "@/libs/http";

const mockFetch = vi.fn<typeof globalThis.fetch>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("execute (via createHttpClient)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  const http = createHttpClient({ baseUrl: "https://api.test" });

  // ---------------------------------------------------------------------------
  // 成功パス
  // ---------------------------------------------------------------------------

  describe("success paths", () => {
    it("GET returns parsed JSON data", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: 1 }));

      const result = await http.get("/users/1");

      expect(result).toEqual({ ok: true, data: { id: 1 } });
      expect(mockFetch).toHaveBeenCalledWith("https://api.test/users/1", expect.objectContaining({ method: "GET" }));
    });

    it("GET with Zod schema validates and types the response", async () => {
      const schema = z.object({ id: z.number() });
      mockFetch.mockResolvedValue(jsonResponse({ id: 1 }));

      const result = await http.get("/users/1", { schema });

      expect(result).toEqual({ ok: true, data: { id: 1 } });
    });

    it("POST sends JSON body with Content-Type header", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await http.post("/submit", { name: "test" });

      const [, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("POST");
      expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
      expect(init?.body).toBe(JSON.stringify({ name: "test" }));
    });

    it("merges config headers with request headers (request wins)", async () => {
      const client = createHttpClient({
        baseUrl: "https://api.test",
        headers: { "X-A": "1", "X-B": "config" },
      });
      mockFetch.mockResolvedValue(jsonResponse({}));

      await client.get("/test", { headers: { "X-B": "request", "X-C": "3" } });

      const headers = mockFetch.mock.calls[0][1]?.headers as Record<string, string>;
      expect(headers).toEqual(expect.objectContaining({ "X-A": "1", "X-B": "request", "X-C": "3" }));
    });
  });

  // ---------------------------------------------------------------------------
  // エラー分類
  // ---------------------------------------------------------------------------

  describe("error classification", () => {
    it("returns network error when fetch throws TypeError", async () => {
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const result = await http.get("/fail");

      expect(result).toEqual({
        ok: false,
        error: { type: "network", message: "Network error" },
      });
    });

    it("returns network error when response body read fails", async () => {
      const badResponse = new Response("data", { status: 200 });
      vi.spyOn(badResponse, "text").mockRejectedValue(new Error("read failed"));
      mockFetch.mockResolvedValue(badResponse);

      const result = await http.get("/fail");

      expect(result).toEqual({
        ok: false,
        error: { type: "network", message: "Failed to read response body" },
      });
    });

    it("returns timeout error when request exceeds timeout", async () => {
      // mock fetch が解決しないまま AbortSignal.timeout が発火する
      mockFetch.mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            const signal = (init as RequestInit).signal as AbortSignal;
            if (signal.aborted) {
              reject(signal.reason);
              return;
            }
            signal.addEventListener("abort", () => reject(signal.reason));
          }),
      );

      const result = await http.get("/slow", { timeout: 1 });

      expect(result).toEqual({
        ok: false,
        error: { type: "timeout", message: "Request timed out after 1ms" },
      });
    });

    it("returns abort error when user cancels via AbortController", async () => {
      const ac = new AbortController();
      mockFetch.mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            const signal = (init as RequestInit).signal as AbortSignal;
            if (signal.aborted) {
              reject(signal.reason);
              return;
            }
            signal.addEventListener("abort", () => reject(signal.reason));
          }),
      );

      // すぐに abort → fetch が reject → execute の catch に入る
      ac.abort();
      const result = await http.get("/cancel", { signal: ac.signal });

      expect(result).toEqual({
        ok: false,
        error: { type: "abort", message: "Request was cancelled" },
      });
    });

    it("returns http error for non-2xx status", async () => {
      mockFetch.mockResolvedValue(new Response("", { status: 404, statusText: "Not Found" }));

      const result = await http.get("/missing");

      expect(result).toEqual({
        ok: false,
        error: { type: "http", status: 404, message: "HTTP 404 Not Found" },
      });
    });

    it("returns no-content error for HTTP 204", async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 204, statusText: "No Content" }));

      const result = await http.get("/empty");

      expect(result).toEqual({
        ok: false,
        error: { type: "no-content", message: "No content (HTTP 204)" },
      });
    });

    it("returns parse error for invalid JSON body", async () => {
      mockFetch.mockResolvedValue(new Response("not json", { status: 200 }));

      const result = await http.get("/bad-json");

      expect(result).toEqual({
        ok: false,
        error: { type: "parse", message: "Response is not valid JSON" },
      });
    });

    it("returns parse error when Zod schema validation fails", async () => {
      const schema = z.object({ id: z.number() });
      mockFetch.mockResolvedValue(jsonResponse({ id: "not-a-number" }));

      const result = await http.get("/users/1", { schema });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("parse");
      }
    });
  });
});
