import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./apiClient";
import { createSseParser, type SseEvent, streamVexAnswer } from "./vexStream";

const parse = (...chunks: string[]): SseEvent[] => {
  const events: SseEvent[] = [];
  const parser = createSseParser((e) => events.push(e));
  chunks.forEach((chunk) => parser.push(chunk));
  return events;
};

describe("createSseParser", () => {
  it("reads named events", () => {
    expect(parse('event: delta\ndata: {"t":"a"}\n\nevent: done\ndata: {}\n\n')).toEqual([
      { event: "delta", data: '{"t":"a"}' },
      { event: "done", data: "{}" },
    ]);
  });

  it("puts back an event split anywhere across network chunks", () => {
    const whole = 'event: delta\ndata: {"t":"hello"}\n\nevent: done\ndata: {}\n\n';
    for (let cut = 1; cut < whole.length; cut++) {
      expect(parse(whole.slice(0, cut), whole.slice(cut))).toEqual(parse(whole));
    }
    expect(parse(...whole.split(""))).toEqual(parse(whole));
  });

  it("accepts CRLF and lone CR line ends, even with a CRLF split between chunks", () => {
    const expected = [{ event: "delta", data: "x" }];
    expect(parse("event: delta\r\ndata: x\r\n\r\n")).toEqual(expected);
    expect(parse("event: delta\rdata: x\r\r: next\n")).toEqual(expected);
    expect(parse("event: delta\r", "\ndata: x\r", "\n\r", "\n")).toEqual(expected);
  });

  it("joins several data lines with a newline", () => {
    expect(parse("data: one\ndata: two\n\n")).toEqual([{ event: "message", data: "one\ntwo" }]);
  });

  it("skips comments, other fields, and events without data", () => {
    expect(parse(": keep-alive\n\nid: 7\nretry: 10\nevent: ping\n\ndata:x\n\n")).toEqual([
      { event: "message", data: "x" },
    ]);
  });

  it("waits for the blank line before dispatching", () => {
    expect(parse("event: delta\ndata: x\n")).toEqual([]);
  });
});

/** A fetch response whose body arrives in the given pieces. */
const sseResponse = (chunks: string[], init: ResponseInit = {}) => {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Response(body, { status: 200, ...init });
};

const options = (signal = new AbortController().signal) => {
  const deltas: string[] = [];
  return {
    deltas,
    opts: {
      question: "Q",
      locale: "pl",
      sessionKey: "a".repeat(32),
      signal,
      onDelta: (text: string): void => {
        deltas.push(text);
      },
    },
  };
};

describe("streamVexAnswer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the question in the body and the session in a header, never the URL", async () => {
    const fetchMock = vi.fn(async () => sseResponse(["event: done\ndata: {}\n\n"]));
    vi.stubGlobal("fetch", fetchMock);
    await streamVexAnswer(options().opts);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/vex/chat/stream/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ question: "Q", locale: "pl" });
    expect((init.headers as Record<string, string>)["X-Vex-Session"]).toBe("a".repeat(32));
  });

  it("hands over each chunk exactly, newlines, quotes and JSON-looking text included", async () => {
    const texts = ["## Head\n\n", 'say "hi"', "a \\n literal", '{"text":"x"}', "data: y\n\nz"];
    const frames = texts.map((t) => `event: delta\ndata: ${JSON.stringify({ t })}\n\n`).join("");
    vi.stubGlobal("fetch", async () =>
      sseResponse([frames.slice(0, 17), frames.slice(17), "event: done\ndata: {}\n\n"]),
    );
    const { deltas, opts } = options();
    expect(await streamVexAnswer(opts)).toEqual({ kind: "done" });
    expect(deltas).toEqual(texts);
  });

  it("ends cleanly on a done that comes before any text", async () => {
    vi.stubGlobal("fetch", async () => sseResponse(["event: done\ndata: {}\n\n"]));
    const { deltas, opts } = options();
    expect(await streamVexAnswer(opts)).toEqual({ kind: "done" });
    expect(deltas).toEqual([]);
  });

  it("returns the code of an error event, and unknown events are ignored", async () => {
    vi.stubGlobal("fetch", async () =>
      sseResponse([
        'event: usage\ndata: {"t":"no"}\n\nevent: error\ndata: {"code": "timeout"}\n\n',
      ]),
    );
    const { deltas, opts } = options();
    expect(await streamVexAnswer(opts)).toEqual({ kind: "error", code: "timeout" });
    expect(deltas).toEqual([]);
  });

  it("reads a stream that stops without an ending as cut off", async () => {
    vi.stubGlobal("fetch", async () => sseResponse(['event: delta\ndata: {"t":"half"}\n\n']));
    expect(await streamVexAnswer(options().opts)).toEqual({ kind: "error", code: "unavailable" });
  });

  it("throws a refusal with its status, body and Retry-After for vexErrors to read", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response('{"code": "rate_limited"}', {
          status: 429,
          headers: { "Retry-After": "42", "Content-Type": "application/json" },
        }),
    );
    const err = await streamVexAnswer(options().opts).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(429);
    expect((err as ApiError).body).toBe('{"code": "rate_limited"}');
    expect((err as ApiError).headers.get("Retry-After")).toBe("42");
  });

  it("stops reading and drops the connection when aborted mid-stream", async () => {
    const controller = new AbortController();
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      const body = new ReadableStream<Uint8Array>({
        start(stream) {
          stream.enqueue(new TextEncoder().encode('event: delta\ndata: {"t":"first"}\n\n'));
          // Like fetch itself: an abort errors the body the reader is waiting on.
          init.signal?.addEventListener("abort", () => stream.error(init.signal?.reason));
        },
      });
      return new Response(body);
    });
    const { deltas, opts } = options(controller.signal);
    opts.onDelta = (text) => {
      deltas.push(text);
      controller.abort();
    };
    await expect(streamVexAnswer(opts)).rejects.toMatchObject({ name: "AbortError" });
    expect(deltas).toEqual(["first"]);
  });
});
