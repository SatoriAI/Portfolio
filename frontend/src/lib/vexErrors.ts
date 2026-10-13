import { ApiError } from "@/lib/apiClient";

/** The longest question the backend accepts (vex.api.limits.QUESTION_MAX_LENGTH). */
export const VEX_QUESTION_MAX_LENGTH = 1000;

/** Why a question went unanswered, as the visitor is told it (translations: chat.errors). */
export const VEX_ERROR_CODES = [
  "rate_limited",
  "daily_limit",
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
  // An aborted fetch is the widget's own timeout giving up on the request.
  if ((err as { name?: unknown } | null)?.name === "AbortError") return "timeout";
  if (!(err instanceof ApiError)) return "unavailable";
  if (err.status === 429) {
    const wait = Number(err.headers.get("Retry-After"));
    return wait > DAILY_LIMIT_WAIT_SECONDS ? "daily_limit" : "rate_limited";
  }
  return codeIn(err.body) ?? "unavailable";
}

/**
 * An `error` event on the stream. The backend's own event carries `{"code": …}`;
 * the browser's native one (dropped connection, refused request) carries nothing.
 */
export function vexStreamErrorCode(data: unknown): VexErrorCode {
  return (typeof data === "string" && codeIn(data)) || "unavailable";
}
