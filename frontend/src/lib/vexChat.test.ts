import { describe, expect, it } from "vitest";

import {
  type ChatAction,
  chatReducer,
  type ChatState,
  initialChatState,
  isWaiting,
} from "./vexChat";

const run = (...actions: ChatAction[]): ChatState => actions.reduce(chatReducer, initialChatState);

const texts = (state: ChatState) =>
  state.messages.map((m) => (m.error ? `!${m.error}` : `${m.isUser ? "Q" : "A"}:${m.text}`));

describe("chatReducer", () => {
  it("shows the question at once and waits for the first word of the reply", () => {
    const state = run({ type: "ask", question: "Hi" });
    expect(texts(state)).toEqual(["Q:Hi"]);
    expect(state.active?.question).toBe("Hi");
    expect(isWaiting(state)).toBe(true);
  });

  it("builds the reply from its deltas and ends the turn on done", () => {
    const streaming = run(
      { type: "ask", question: "Hi" },
      { type: "delta", text: "## Hel" },
      { type: "delta", text: "lo\n\n" },
    );
    expect(isWaiting(streaming)).toBe(false);
    const done = chatReducer(streaming, { type: "done" });
    expect(texts(done)).toEqual(["Q:Hi", "A:## Hello\n\n"]);
    expect(done.active).toBeNull();
  });

  it("stops waiting when done comes before any text", () => {
    const state = run({ type: "ask", question: "Hi" }, { type: "done" });
    expect(isWaiting(state)).toBe(false);
    expect(state.active).toBeNull();
    expect(texts(state)).toEqual(["Q:Hi"]);
  });

  it("queues a question asked while a reply streams and sends it after the reply", () => {
    let state = run(
      { type: "ask", question: "First" },
      { type: "delta", text: "one" },
      { type: "ask", question: "Second" },
      { type: "ask", question: "Third" },
    );
    expect(texts(state)).toEqual(["Q:First", "A:one"]);
    expect(state.queue).toEqual(["Second", "Third"]);
    const firstTurn = state.active?.turn;

    state = chatReducer(state, { type: "done" });
    expect(state.active?.question).toBe("Second");
    expect(state.active?.turn).not.toBe(firstTurn);
    expect(state.queue).toEqual(["Third"]);
    expect(texts(state)).toEqual(["Q:First", "A:one", "Q:Second"]);

    state = chatReducer(chatReducer(state, { type: "delta", text: "two" }), { type: "done" });
    expect(texts(state)).toEqual(["Q:First", "A:one", "Q:Second", "A:two", "Q:Third"]);
  });

  it("drops the queue behind a failed reply and says why", () => {
    const state = run(
      { type: "ask", question: "First" },
      { type: "ask", question: "Second" },
      { type: "fail", code: "rate_limited" },
    );
    expect(texts(state)).toEqual(["Q:First", "!rate_limited"]);
    expect(state.active).toBeNull();
    expect(state.queue).toEqual([]);
  });

  it("abandons the reply and the queue when the chat closes, and ignores what arrives late", () => {
    const stopped = run(
      { type: "ask", question: "First" },
      { type: "delta", text: "par" },
      { type: "ask", question: "Second" },
      { type: "stop" },
    );
    expect(stopped.active).toBeNull();
    expect(stopped.queue).toEqual([]);
    expect(chatReducer(stopped, { type: "delta", text: "tial" })).toBe(stopped);
    expect(chatReducer(stopped, { type: "done" })).toBe(stopped);
    expect(chatReducer(stopped, { type: "fail", code: "timeout" })).toBe(stopped);
  });

  it("clears everything but keeps numbering turns, so a new question is a new request", () => {
    const before = run({ type: "ask", question: "Hi" });
    const cleared = chatReducer(before, { type: "clear" });
    expect(cleared.messages).toEqual([]);
    expect(cleared.active).toBeNull();
    const again = chatReducer(cleared, { type: "ask", question: "Hi" });
    expect(again.active?.turn).not.toBe(before.active?.turn);
  });

  it("loads the history the server returns, without its system messages", () => {
    const state = run({
      type: "hydrated",
      stored: [
        { id: 1, role: "user", content: "Q1", created_at: "2026-01-01T00:00:00Z" },
        { id: 2, role: "system", content: "S", created_at: "2026-01-01T00:00:01Z" },
        { id: 3, role: "assistant", content: "A1", created_at: "2026-01-01T00:00:02Z" },
      ],
    });
    expect(texts(state)).toEqual(["Q:Q1", "A:A1"]);
  });
});
