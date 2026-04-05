import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@/libs/http";

const mockFetch = vi.fn<typeof globalThis.fetch>();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createHttpClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue(jsonResponse({}));
  });

  it("prepends baseUrl to request path", async () => {
    const http = createHttpClient({ baseUrl: "https://example.com" });

    await http.get("/users");

    expect(mockFetch).toHaveBeenCalledWith("https://example.com/users", expect.anything());
  });

  it("applies config headers to all requests", async () => {
    const http = createHttpClient({ headers: { Authorization: "Bearer token" } });

    await http.get("/a");
    await http.post("/b", {});

    for (const [, init] of mockFetch.mock.calls) {
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer token");
    }
  });
});
