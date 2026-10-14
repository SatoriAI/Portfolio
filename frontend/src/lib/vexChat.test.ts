import { describe, expect, it } from "vitest";

import {
  type ChatAction,
  chatReducer,
  type ChatState,
  initialChatState,
  isWaiting,
  retryableQuestion,
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
    m.error
      ? `!${m.error}`
      : m.noAnswer
        ? "!no_answer"
        : m.stopped
          ? `stopped:${m.text}`
          : `${m.isUser ? "Q" : "A"}:${m.text}`,
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

  it("stays open to questions while Vex rests, answering each with the same notice", () => {
    const first = run({ type: "ask", question: "First" });
    const rested = chatReducer(first, { type: "fail", turn: turnOf(first), code: "resting" });
    expect(isWaiting(rested)).toBe(false);
    const again = chatReducer(rested, { type: "ask", question: "Second" });
    const state = chatReducer(again, { type: "fail", turn: turnOf(again), code: "resting" });
    expect(texts(state)).toEqual(["Q:First", "!resting", "Q:Second", "!resting"]);
    expect(isWaiting(state)).toBe(false);
  });

  it("abandons the reply and the queue when the chat closes, and ignores what arrives late", () => {
    const asked = run({ type: "ask", question: "First" });
    const turn = turnOf(asked);
    const stopped = reduce(
      asked,
      { type: "delta", turn, text: "par" },
      { type: "ask", question: "Second" },
      { type: "close" },
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
      { type: "close" },
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
        { type: "close" },
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
          type: "close",
        },
      );
      const state = chatReducer(failed, { type: "hydrated", stored: null });
      expect(texts(state)).toEqual(["Q:Hi", "!unavailable"]);
      expect(state.hydrated).toBe(true);
    });
  });
});

describe("stopping a reply", () => {
  it("keeps the text that arrived, marked, and ends the turn", () => {
    const asked = run({ type: "ask", question: "Hi" });
    const turn = turnOf(asked);
    const state = reduce(asked, { type: "delta", turn, text: "Hel" }, { type: "stop" });
    expect(texts(state)).toEqual(["Q:Hi", "stopped:Hel"]);
    expect(state.active).toBeNull();
    expect(state.replyId).toBeNull();
    expect(state.finishedId).toBe(state.messages[1].id);
    // The stream's late words and its end belong to a turn that is over.
    expect(chatReducer(state, { type: "delta", turn, text: "lo" })).toBe(state);
    expect(chatReducer(state, { type: "done", turn, messageId: 7 })).toBe(state);
  });

  it("leaves the mark alone when no text had arrived, and drops the queue", () => {
    const asked = run({ type: "ask", question: "Hi" }, { type: "ask", question: "Next" });
    const state = chatReducer(asked, { type: "stop" });
    expect(texts(state)).toEqual(["Q:Hi", "stopped:"]);
    expect(state.queue).toEqual([]);
    expect(isWaiting(state)).toBe(false);
  });

  it("does nothing with no reply in flight", () => {
    const idle = run();
    expect(chatReducer(idle, { type: "stop" })).toBe(idle);
  });
});

describe("asking again", () => {
  const answered = (state: ChatState, text: string, messageId?: number) => {
    const turn = turnOf(state);
    return reduce(state, { type: "delta", turn, text }, { type: "done", turn, messageId });
  };

  it("replaces a stopped reply with a new answer to the same question, without a second question", () => {
    const asked = run({ type: "ask", question: "Hi" });
    const stopped = reduce(
      asked,
      { type: "delta", turn: turnOf(asked), text: "Hel" },
      { type: "stop" },
    );
    expect(retryableQuestion(stopped)).toBe("Hi");
    const retried = chatReducer(stopped, { type: "retry" });
    expect(texts(retried)).toEqual(["Q:Hi"]);
    expect(retried.active?.question).toBe("Hi");
    expect(retried.active?.turn).not.toBe(asked.active?.turn);
    expect(texts(answered(retried, "Hello"))).toEqual(["Q:Hi", "A:Hello"]);
  });

  it("asks again after a failure that asking again could mend, and after no answer", () => {
    for (const code of ["timeout", "unavailable", "rate_limited"] as const) {
      const asked = run({ type: "ask", question: "Hi" });
      const failed = chatReducer(asked, { type: "fail", turn: turnOf(asked), code });
      expect(texts(chatReducer(failed, { type: "retry" }))).toEqual(["Q:Hi"]);
    }
    const asked = run({ type: "ask", question: "Hi" });
    const empty = chatReducer(asked, { type: "done", turn: turnOf(asked) });
    expect(chatReducer(empty, { type: "retry" }).active?.question).toBe("Hi");
  });

  it("clears away the part of a reply that arrived before it failed", () => {
    const asked = run({ type: "ask", question: "Hi" });
    const turn = turnOf(asked);
    const failed = reduce(
      asked,
      { type: "delta", turn, text: "Hal" },
      { type: "fail", turn, code: "unavailable" },
    );
    expect(texts(failed)).toEqual(["Q:Hi", "A:Hal", "!unavailable"]);
    expect(failed.messages[1].incomplete).toBe(true);
    const retried = chatReducer(failed, { type: "retry" });
    expect(texts(retried)).toEqual(["Q:Hi"]);
    expect(texts(answered(retried, "Hello"))).toEqual(["Q:Hi", "A:Hello"]);
  });

  it("does not offer it where the same question would only fail again", () => {
    for (const code of [
      "question_too_long",
      "daily_limit",
      "resting",
      "invalid_session",
    ] as const) {
      const asked = run({ type: "ask", question: "Hi" });
      const failed = chatReducer(asked, { type: "fail", turn: turnOf(asked), code });
      expect(retryableQuestion(failed)).toBeNull();
      expect(chatReducer(failed, { type: "retry" })).toBe(failed);
    }
  });

  it("does not offer it for a finished reply, during a turn, or before the history loads", () => {
    const done = answered(run({ type: "ask", question: "Hi" }), "Hello");
    expect(retryableQuestion(done)).toBeNull();

    const stopped = chatReducer(run({ type: "ask", question: "Hi" }), { type: "stop" });
    const busy = chatReducer(stopped, { type: "ask", question: "Other" });
    expect(retryableQuestion(busy)).toBeNull();
    expect(chatReducer(busy, { type: "retry" })).toBe(busy);

    // Closed and reopened: the history is on its way and will replace the screen.
    const reopened = chatReducer(stopped, { type: "close" });
    expect(retryableQuestion(reopened)).toBeNull();
    expect(chatReducer(reopened, { type: "retry" })).toBe(reopened);
  });

  it("offers it only on the last reply", () => {
    const stopped = chatReducer(run({ type: "ask", question: "One" }), { type: "stop" });
    const later = answered(chatReducer(stopped, { type: "ask", question: "Two" }), "2");
    expect(retryableQuestion(later)).toBeNull();
  });
});

describe("rating a reply", () => {
  const saved = () => {
    const asked = run({ type: "ask", question: "Hi" });
    const turn = turnOf(asked);
    return reduce(
      asked,
      { type: "delta", turn, text: "Hello" },
      { type: "done", turn, messageId: 42 },
    );
  };

  it("names the saved answer from done, unrated", () => {
    const reply = saved().messages[1];
    expect(reply.serverId).toBe(42);
    expect(reply.feedback).toBeNull();
  });

  it("leaves a reply without an id when the server sent none", () => {
    const asked = run({ type: "ask", question: "Hi" });
    const turn = turnOf(asked);
    const state = reduce(asked, { type: "delta", turn, text: "x" }, { type: "done", turn });
    expect(state.messages[1].serverId).toBeUndefined();
  });

  it("sets, changes and takes back a rating", () => {
    const state = saved();
    const id = state.messages[1].id;
    const up = chatReducer(state, { type: "rate", id, feedback: "up" });
    expect(up.messages[1].feedback).toBe("up");
    const down = chatReducer(up, { type: "rate", id, feedback: "down" });
    expect(down.messages[1].feedback).toBe("down");
    expect(chatReducer(down, { type: "rate", id, feedback: null }).messages[1].feedback).toBeNull();
  });

  it("undoes a failed save only while the rating is still the one that failed", () => {
    const state = saved();
    const id = state.messages[1].id;
    const up = chatReducer(state, { type: "rate", id, feedback: "up" });
    const undone = chatReducer(up, { type: "rate", id, feedback: null, ifCurrent: "up" });
    expect(undone.messages[1].feedback).toBeNull();

    const changed = chatReducer(up, { type: "rate", id, feedback: "down" });
    const late = chatReducer(changed, { type: "rate", id, feedback: null, ifCurrent: "up" });
    expect(late.messages[1].feedback).toBe("down");
  });

  it("loads the ratings and ids with the history", () => {
    const state = run({
      type: "hydrated",
      stored: [
        { id: 5, role: "user", content: "Q", created_at: "2026-01-01T00:00:00Z" },
        {
          id: 6,
          role: "assistant",
          content: "A",
          created_at: "2026-01-01T00:00:01Z",
          feedback: "down",
        },
        { id: 7, role: "assistant", content: "B", created_at: "2026-01-01T00:00:02Z" },
      ],
    });
    expect(state.messages.map((m) => [m.serverId, m.feedback])).toEqual([
      [undefined, undefined],
      [6, "down"],
      [7, null],
    ]);
  });
});
