// Vex's answer stream: a POST whose response is a text/event-stream, read with
// fetch so the question and the session key travel in the body and a header,
// never the URL, and a refusal's status and body stay readable.
//
// The protocol (vex.api.sse): `delta` events carry `{"t": text}`, then one
// `done` carrying the saved answer's `{"message_id": id, "truncated": bool}`
// (truncated when the model was cut off at the length cap), or an `error`
// carrying `{"code": …}`. Every payload is JSON on a
// single data line, so the text arrives exactly as the model wrote it.

import { buildUrl, endpoints } from "@/config/endpoints";
import { ApiError } from "@/lib/apiClient";
import type { VexAskContext } from "@/lib/vexChat";
import { type VexErrorCode, vexStreamErrorCode } from "@/lib/vexErrors";

export interface SseEvent {
  event: string;
  data: string;
}

/**
 * An incremental parser for the text/event-stream format, fed the decoded text
 * as it arrives. Network chunks split anywhere (mid-line, between a CR and its
 * LF), so a line is only read once its end has arrived. Handles LF, CR and CRLF
 * line ends, comments, and data spread over several lines (joined with "\n").
 * Fields other than `event` and `data` (id, retry) mean nothing here and are
 * skipped.
 */
export function createSseParser(onEvent: (event: SseEvent) => void) {
  let buffer = "";
  let event = "";
  let data: string[] = [];

  const line = (text: string) => {
    if (text === "") {
      // A blank line dispatches; an event with no data is not dispatched.
      if (data.length) onEvent({ event: event || "message", data: data.join("\n") });
      event = "";
      data = [];
      return;
    }
    if (text.startsWith(":")) return;
    const colon = text.indexOf(":");
    const field = colon === -1 ? text : text.slice(0, colon);
    let value = colon === -1 ? "" : text.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  };

  return {
    push(text: string) {
      buffer += text;
      let start = 0;
      for (let i = 0; i < buffer.length; i++) {
        const ch = buffer[i];
        if (ch !== "\n" && ch !== "\r") continue;
        // A CR at the very end may be the first half of a CRLF still in flight.
        if (ch === "\r" && i === buffer.length - 1) break;
        line(buffer.slice(start, i));
        if (ch === "\r" && buffer[i + 1] === "\n") i++;
        start = i + 1;
      }
      buffer = buffer.slice(start);
    },
  };
}

/**
 * How a stream ended; a finished one names the saved answer, when the server
 * said which, and whether the model was cut off in it.
 */
export type VexStreamEnd =
  | { kind: "done"; messageId?: number; truncated?: boolean }
  | { kind: "error"; code: VexErrorCode };

function finished(data: string): VexStreamEnd {
  try {
    const payload = JSON.parse(data) as { message_id?: unknown; truncated?: unknown } | null;
    const id = payload?.message_id;
    return {
      kind: "done",
      messageId: typeof id === "number" && Number.isInteger(id) ? id : undefined,
      ...(payload?.truncated === true ? { truncated: true } : {}),
    };
  } catch {
    return { kind: "done" };
  }
}

interface StreamOptions {
  question: string;
  /** Where on the site the question was asked, when it was about something in particular. */
  context?: VexAskContext;
  locale: string;
  sessionKey: string;
  csrfToken?: string | null;
  signal: AbortSignal;
  onDelta: (text: string) => void;
}

/**
 * Ask one question and read the answer as it streams. Resolves with how the
 * stream ended; a refusal (400, 429) throws an ApiError for vexRequestErrorCode
 * to read, and aborting the signal throws an AbortError and drops the
 * connection, which the server takes as the visitor leaving.
 */
export async function streamVexAnswer({
  question,
  context,
  locale,
  sessionKey,
  csrfToken,
  signal,
  onDelta,
}: StreamOptions): Promise<VexStreamEnd> {
  const response = await fetch(buildUrl(endpoints.vex.chat.stream), {
    method: "POST",
    headers: {
      Accept: "text/event-stream, application/json",
      "Content-Type": "application/json",
      "X-Vex-Session": sessionKey,
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    },
    body: JSON.stringify({ question, locale, ...(context ? { context } : {}) }),
    signal,
  });
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new ApiError(response.status, response.statusText, text, response.headers);
  }

  // Set from the parser callback, which control-flow narrowing cannot see.
  let end = null as VexStreamEnd | null;
  const parser = createSseParser(({ event, data }) => {
    if (end) return;
    if (event === "delta") {
      const text = (JSON.parse(data) as { t?: unknown }).t;
      if (typeof text === "string" && text) onDelta(text);
    } else if (event === "done") {
      end = finished(data);
    } else if (event === "error") {
      end = { kind: "error", code: vexStreamErrorCode(data) };
    }
    // Any other event is one this client does not know yet, and is skipped.
  });

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (!end) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
    }
  } finally {
    // Ends the read whichever way the loop left: after `done` the server has
    // nothing more to send, and after an exception the connection is dropped.
    reader.cancel().catch(() => {});
  }
  // A stream that stops without saying how it ended was cut off on the way.
  return end ?? { kind: "error", code: "unavailable" };
}
