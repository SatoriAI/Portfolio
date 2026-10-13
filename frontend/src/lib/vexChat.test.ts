import { describe, expect, it } from "vitest";

import {
  type ChatAction,
  chatReducer,
  type ChatState,
  initialChatState,
  isWaiting,
  type StoredMessage,
} from "./vexChat";

const stored = (...pairs: [StoredMessage["role"], string][]): StoredMessage[] =>
  pairs.map(([role, content], i) => ({
    id: i + 1,
    role,
    content,
    created_at: `2026-01-01T00:00:0${i}Z`,
  }));

const reduce = (state: ChatState, ...actions: ChatAction[]): ChatState =>
  actions.reduce(chatReducer, state);

/** From an open chat whose (empty) history has loaded. */
const run = (...actions: ChatAction[]): ChatState =>
  reduce(initialChatState, { type: "hydrated", stored: [] }, ...actions);

const turnOf = (state: ChatState): number => {
  if (!state.active) throw new Error("no active turn");
  return state.active.turn;
};

const texts = (state: ChatState) =>
  state.messages.map((m) =>
    m.error ? `!${m.error}` : m.noAnswer ? "!no_answer" : `${m.isUser ? "Q" : "A"}:${m.text}`,
  );

describe("chatReducer", () => {
  it("shows the question at once and waits for the first word of the reply", () => {
    const state = run({ type: "ask", question: "Hi" });
    expect(texts(state)).toEqual(["Q:Hi"]);
    expect(state.active?.question).toBe("Hi");
    expect(isWaiting(state)).toBe(true);
  });

  it("builds the reply from its deltas and ends the turn on done", () => {
    let state = run({ type: "ask", question: "Hi" });
    const turn = turnOf(state);
    state = reduce(
      state,
      { type: "delta", turn, text: "## Hel" },
      { type: "delta", turn, text: "lo\n\n" },
    );
    expect(isWaiting(state)).toBe(false);
    const done = chatReducer(state, { type: "done", turn });
    expect(texts(done)).toEqual(["Q:Hi", "A:## Hello\n\n"]);
    expect(done.active).toBeNull();
    expect(done.finishedId).toBe(done.messages[1].id);
  });

  it("says so when a reply ends before any text", () => {
    const asked = run({ type: "ask", question: "Hi" });
    const state = chatReducer(asked, { type: "done", turn: turnOf(asked) });
    expect(isWaiting(state)).toBe(false);
    expect(state.active).toBeNull();
    expect(texts(state)).toEqual(["Q:Hi", "!no_answer"]);
    expect(state.finishedId).toBe(state.messages[1].id);
  });

  it("queues a question asked while a reply streams and sends it after the reply", () => {
    let state = run({ type: "ask", question: "First" });
    const first = turnOf(state);
    state = reduce(
      state,
      { type: "delta", turn: first, text: "one" },
      { type: "ask", question: "Second" },
      { type: "ask", question: "Third" },
    );
    expect(texts(state)).toEqual(["Q:First", "A:one"]);
    expect(state.queue).toEqual(["Second", "Third"]);

    state = chatReducer(state, { type: "done", turn: first });
    const second = turnOf(state);
    expect(state.active?.question).toBe("Second");
    expect(second).not.toBe(first);
    expect(state.queue).toEqual(["Third"]);
    expect(texts(state)).toEqual(["Q:First", "A:one", "Q:Second"]);

    state = reduce(
      state,
      { type: "delta", turn: second, text: "two" },
      { type: "done", turn: second },
    );
    expect(texts(state)).toEqual(["Q:First", "A:one", "Q:Second", "A:two", "Q:Third"]);
  });

  it("drops the queue behind a failed reply and says why", () => {
    const asked = run({ type: "ask", question: "First" }, { type: "ask", question: "Second" });
    const state = chatReducer(asked, { type: "fail", turn: turnOf(asked), code: "rate_limited" });
    expect(texts(state)).toEqual(["Q:First", "!rate_limited"]);
    expect(state.active).toBeNull();
    expect(state.queue).toEqual([]);
  });

  it("abandons the reply and the queue when the chat closes, and ignores what arrives late", () => {
    const asked = run({ type: "ask", question: "First" });
    const turn = turnOf(asked);
    const stopped = reduce(
      asked,
      { type: "delta", turn, text: "par" },
      { type: "ask", question: "Second" },
      { type: "stop" },
    );
    expect(stopped.active).toBeNull();
    expect(stopped.queue).toEqual([]);
    expect(chatReducer(stopped, { type: "delta", turn, text: "tial" })).toBe(stopped);
    expect(chatReducer(stopped, { type: "done", turn })).toBe(stopped);
    expect(chatReducer(stopped, { type: "fail", turn, code: "timeout" })).toBe(stopped);
  });

  it("keeps an old turn's late text out of the new turn", () => {
    const first = run({ type: "ask", question: "First" });
    const old = turnOf(first);
    const second = reduce(
      first,
      { type: "stop" },
      { type: "hydrated", stored: null },
      {
        type: "ask",
        question: "Second",
      },
    );
    const state = reduce(
      second,
      { type: "delta", turn: old, text: "stale" },
      { type: "done", turn: old },
    );
    expect(state).toBe(second);
    expect(state.active?.question).toBe("Second");
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
      stored: stored(["user", "Q1"], ["system", "S"], ["assistant", "A1"]),
    });
    expect(texts(state)).toEqual(["Q:Q1", "A:A1"]);
  });

  describe("history and a question racing", () => {
    const history = stored(["user", "Earlier"], ["assistant", "Answer"]);

    it("holds a question asked before the history loads, then asks it after the history", () => {
      // Typing before the history lands, or a question handed over on open.
      const waiting = reduce(initialChatState, { type: "ask", question: "Now" });
      expect(waiting.active).toBeNull();
      expect(waiting.queue).toEqual(["Now"]);

      const state = chatReducer(waiting, { type: "hydrated", stored: history });
      expect(texts(state)).toEqual(["Q:Earlier", "A:Answer", "Q:Now"]);
      expect(state.active?.question).toBe("Now");
      expect(state.queue).toEqual([]);
    });

    it("holds a question handed over on reopening until that open's history loads", () => {
      // The previous open finished loading; closing resets it for the next.
      const first = run({ type: "ask", question: "One" });
      const turn = turnOf(first);
      const closed = reduce(
        first,
        { type: "delta", turn, text: "1" },
        { type: "done", turn },
        { type: "stop" },
      );
      const reopened = chatReducer(closed, { type: "ask", question: "Two" });
      expect(reopened.active).toBeNull();

      const state = chatReducer(reopened, {
        type: "hydrated",
        stored: stored(["user", "One"], ["assistant", "1"]),
      });
      expect(texts(state)).toEqual(["Q:One", "A:1", "Q:Two"]);
      expect(state.active?.question).toBe("Two");

      const answered = reduce(
        state,
        { type: "delta", turn: turnOf(state), text: "2" },
        { type: "done", turn: turnOf(state) },
      );
      expect(texts(answered)).toEqual(["Q:One", "A:1", "Q:Two", "A:2"]);
    });

    it("keeps a conversation under way if history somehow arrives during it", () => {
      const asked = run({ type: "ask", question: "Now" });
      const streaming = chatReducer(asked, { type: "delta", turn: turnOf(asked), text: "par" });
      const state = chatReducer(streaming, { type: "hydrated", stored: history });
      expect(texts(state)).toEqual(["Q:Now", "A:par"]);
      expect(state.active).toEqual(streaming.active);
    });

    it("keeps what is on screen when there is no history to load", () => {
      const asked = run({ type: "ask", question: "Hi" });
      const failed = reduce(
        asked,
        { type: "fail", turn: turnOf(asked), code: "unavailable" },
        {
          type: "stop",
        },
      );
      const state = chatReducer(failed, { type: "hydrated", stored: null });
      expect(texts(state)).toEqual(["Q:Hi", "!unavailable"]);
      expect(state.hydrated).toBe(true);
    });
  });
});
