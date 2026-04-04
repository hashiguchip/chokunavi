import { describe, expect, it, vi } from "vitest";
import { type HttpError, Result } from "../types";

describe("Result", () => {
  describe("ok", () => {
    it("wraps a value as success", () => {
      expect(Result.ok(42)).toEqual({ ok: true, data: 42 });
    });
  });

  describe("err", () => {
    it("wraps an error as failure", () => {
      const error: HttpError = { type: "network", message: "fail" };
      expect(Result.err(error)).toEqual({ ok: false, error });
    });
  });

  describe("map", () => {
    it("transforms data on success", () => {
      const result = Result.map(Result.ok(2), (n) => n * 3);
      expect(result).toEqual({ ok: true, data: 6 });
    });

    it("passes through error on failure without calling fn", () => {
      const error: HttpError = { type: "network", message: "fail" };
      const fn = vi.fn();
      const result = Result.map(Result.err(error), fn);
      expect(result).toEqual({ ok: false, error });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("mapError", () => {
    it("transforms error on failure", () => {
      const error: HttpError = { type: "network", message: "old" };
      const result = Result.mapError(Result.err(error), (e) => ({
        ...e,
        message: "new",
      }));
      expect(result).toEqual({
        ok: false,
        error: { type: "network", message: "new" },
      });
    });

    it("passes through data on success without calling fn", () => {
      const fn = vi.fn();
      const result = Result.mapError(Result.ok(1), fn);
      expect(result).toEqual({ ok: true, data: 1 });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("unwrapOr", () => {
    it("returns data on success", () => {
      expect(Result.unwrapOr(Result.ok(42), 0)).toBe(42);
    });

    it("returns fallback on failure", () => {
      const error: HttpError = { type: "network", message: "fail" };
      const result: Result<number> = Result.err(error);
      expect(Result.unwrapOr(result, 0)).toBe(0);
    });
  });

  describe("match", () => {
    it("calls ok handler on success", () => {
      const result = Result.match(Result.ok(1), {
        ok: (d) => d + 1,
        err: () => -1,
      });
      expect(result).toBe(2);
    });

    it("calls err handler on failure", () => {
      const error: HttpError = { type: "network", message: "fail" };
      const result = Result.match(Result.err(error), {
        ok: () => "unreachable",
        err: (e) => e.type,
      });
      expect(result).toBe("network");
    });
  });
});
