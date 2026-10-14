import { describe, expect, it } from "vitest";

import { ApiError } from "./apiClient";
import { vexRequestErrorCode, vexRetryAfterMs, vexStreamErrorCode } from "./vexErrors";

describe("vexRetryAfterMs", () => {
  it("reads the wait a rate limit asks for, a minute when it names none", () => {
    const throttled = (headers?: HeadersInit) =>
      new ApiError(429, "Too Many Requests", "", new Headers(headers));
    expect(vexRetryAfterMs(throttled({ "Retry-After": "12" }))).toBe(12_000);
    expect(vexRetryAfterMs(throttled())).toBe(60_000);
    expect(vexRetryAfterMs(new Error("offline"))).toBe(60_000);
  });
});

describe("vexRequestErrorCode", () => {
  it("reads a throttled request as rate limited, whatever the body", () => {
    expect(vexRequestErrorCode(new ApiError(429, "Too Many Requests", ""))).toBe("rate_limited");
  });

  it("tells a short wait from the daily cap by Retry-After", () => {
    const throttled = (retryAfter: string) =>
      new ApiError(429, "Too Many Requests", "", new Headers({ "Retry-After": retryAfter }));
    expect(vexRequestErrorCode(throttled("42"))).toBe("rate_limited");
    expect(vexRequestErrorCode(throttled("3600"))).toBe("rate_limited");
    expect(vexRequestErrorCode(throttled("50000"))).toBe("daily_limit");
  });

  it("names a rejected session key, so it is never shown as an outage", () => {
    const err = new ApiError(400, "Bad Request", '{"code":"invalid_session"}');
    expect(vexRequestErrorCode(err)).toBe("invalid_session");
  });

  it("reads an aborted request as a timeout", () => {
    expect(vexRequestErrorCode(new DOMException("The operation was aborted.", "AbortError"))).toBe(
      "timeout",
    );
  });

  it("takes the backend's code from the body", () => {
    const err = new ApiError(400, "Bad Request", '{"code":"question_too_long"}');
    expect(vexRequestErrorCode(err)).toBe("question_too_long");
  });

  it("never passes on text it does not recognise", () => {
    expect(vexRequestErrorCode(new ApiError(500, "Server Error", "<html>Traceback"))).toBe(
      "unavailable",
    );
    expect(vexRequestErrorCode(new ApiError(400, "Bad Request", '{"code":"made_up"}'))).toBe(
      "unavailable",
    );
    expect(vexRequestErrorCode(new TypeError("Failed to fetch"))).toBe("unavailable");
  });
});

describe("vexStreamErrorCode", () => {
  it("reads the code from the backend's error event", () => {
    expect(vexStreamErrorCode('{"code": "unavailable"}')).toBe("unavailable");
    expect(vexStreamErrorCode('{"code": "rate_limited"}')).toBe("rate_limited");
  });

  it("reads the spent daily budget as resting, not as an outage", () => {
    expect(vexStreamErrorCode('{"code": "resting"}')).toBe("resting");
  });

  it("falls back to unavailable for anything that is not a known code", () => {
    expect(vexStreamErrorCode("{}")).toBe("unavailable");
    expect(vexStreamErrorCode("You exceeded your current quota")).toBe("unavailable");
  });
});
