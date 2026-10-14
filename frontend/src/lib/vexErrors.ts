import { ApiError } from "@/lib/apiClient";

/** The longest question the backend accepts (vex.api.limits.QUESTION_MAX_LENGTH). */
export const VEX_QUESTION_MAX_LENGTH = 1000;

/** Why a question went unanswered, as the visitor is told it (translations: chat.errors). */
export const VEX_ERROR_CODES = [
  "rate_limited",
  "daily_limit",
  // Vex's budget for the day is spent; asking again gets the same notice.
  "resting",
  "question_too_long",
  "invalid_session",
  "timeout",
  "unavailable",
] as const;

export type VexErrorCode = (typeof VEX_ERROR_CODES)[number];

// The per-minute limits ask for a wait of a minute at most; a longer one can
// only come from the daily cap.
const DAILY_LIMIT_WAIT_SECONDS = 60 * 60;

function codeIn(json: string): VexErrorCode | null {
  try {
    const code = (JSON.parse(json) as { code?: unknown } | null)?.code;
    return VEX_ERROR_CODES.find((known) => known === code) ?? null;
  } catch {
    return null;
  }
}

/** A failed request: the backend's code when it sent one, otherwise "unavailable". */
export function vexRequestErrorCode(err: unknown): VexErrorCode {
  // An abort is the widget giving up on the request. The widget settles its
  // own aborts (closing, Clear, the watchdog) before asking, so this is only
  // a fallback.
  if ((err as { name?: unknown } | null)?.name === "AbortError") return "timeout";
  if (!(err instanceof ApiError)) return "unavailable";
  if (err.status === 429) {
    const wait = Number(err.headers.get("Retry-After"));
    return wait > DAILY_LIMIT_WAIT_SECONDS ? "daily_limit" : "rate_limited";
  }
  return codeIn(err.body) ?? "unavailable";
}

// A rate limit that does not say how long to wait lasts a minute at most.
const RATE_LIMIT_DEFAULT_WAIT_SECONDS = 60;

/** For a rate-limited request: how long the server asked to wait before asking again, in ms. */
export function vexRetryAfterMs(err: unknown): number {
  const wait = err instanceof ApiError ? Number(err.headers.get("Retry-After")) : NaN;
  return (wait > 0 ? wait : RATE_LIMIT_DEFAULT_WAIT_SECONDS) * 1000;
}

/** The `error` event that ends a stream: the backend's code, never the provider's words. */
export function vexStreamErrorCode(data: string): VexErrorCode {
  return codeIn(data) ?? "unavailable";
}
