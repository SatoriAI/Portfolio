import { ApiError } from "@/lib/apiClient";

/** The longest question the backend accepts (vex.api.limits.QUESTION_MAX_LENGTH). */
export const VEX_QUESTION_MAX_LENGTH = 1000;

/** Why a question went unanswered, as the visitor is told it (translations: chat.errors). */
export type VexErrorCode = "rate_limited" | "question_too_long" | "timeout" | "unavailable";

const KNOWN: readonly VexErrorCode[] = [
  "rate_limited",
  "question_too_long",
  "timeout",
  "unavailable",
];

function codeIn(json: string): VexErrorCode | null {
  try {
    const code = (JSON.parse(json) as { code?: unknown } | null)?.code;
    return KNOWN.includes(code as VexErrorCode) ? (code as VexErrorCode) : null;
  } catch {
    return null;
  }
}

/** A failed request: the backend's code when it sent one, otherwise "unavailable". */
export function vexRequestErrorCode(err: unknown): VexErrorCode {
  if (!(err instanceof ApiError)) return "unavailable";
  if (err.status === 429) return "rate_limited";
  return codeIn(err.body) ?? "unavailable";
}

/**
 * An `error` event on the stream. The backend's own event carries `{"code": …}`;
 * the browser's native one (dropped connection, refused request) carries nothing.
 */
export function vexStreamErrorCode(data: unknown): VexErrorCode {
  return (typeof data === "string" && codeIn(data)) || "unavailable";
}
