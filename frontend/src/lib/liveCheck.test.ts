import { describe, expect, it, vi } from "vitest";

import { checkHost, hostOf } from "./liveCheck";

describe("checkHost", () => {
  it("times an answer, whatever it contains", async () => {
    const times = [100, 184.4];
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    const result = await checkHost("https://picko.world", {
      fetchImpl,
      now: () => times.shift()!,
    });
    expect(result).toEqual({ answered: true, ms: 84 });
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ mode: "no-cors", cache: "no-store" });
  });

  it("calls a network failure no answer", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await checkHost("https://picko.world", { fetchImpl })).toEqual({ answered: false });
  });

  it("gives up at the time limit", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new DOMException("", "AbortError"))),
        ),
    );
    const pending = checkHost("https://picko.world", { fetchImpl, timeoutMs: 8000 });
    await vi.advanceTimersByTimeAsync(8000);
    expect(await pending).toEqual({ answered: false });
    vi.useRealTimers();
  });
});

describe("hostOf", () => {
  it("drops the scheme and www", () => {
    expect(hostOf("https://www.open-grant.com/pl")).toBe("open-grant.com");
  });
});
