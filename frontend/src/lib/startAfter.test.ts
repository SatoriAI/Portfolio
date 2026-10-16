import { afterEach, describe, expect, it, vi } from "vitest";

import { startAfter } from "./startAfter";

describe("startAfter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("starts once the page is prepared", async () => {
    const start = vi.fn();
    await startAfter(Promise.resolve(), start);
    expect(start).toHaveBeenCalledOnce();
  });

  it("still starts, and says why, when preparing the page failed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const start = vi.fn();
    const failure = new Error("Failed to fetch dynamically imported module");
    await startAfter(Promise.reject(failure), start);
    expect(start).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith("Preparing the page failed:", failure);
  });
});
