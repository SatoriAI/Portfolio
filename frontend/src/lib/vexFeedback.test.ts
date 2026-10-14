import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type ChatAction,
  type ChatMessage,
  chatReducer,
  type ChatState,
  type Feedback,
} from "./vexChat";
import { createReplyRater, saveVexFeedback } from "./vexFeedback";

const reply: ChatMessage = { id: "local-2", text: "Hello", isUser: false, serverId: 42 };

/** A chat holding one saved reply, with a dispatch that runs the real reducer. */
const chat = (feedback: ChatMessage["feedback"] = null) => {
  let state: ChatState = {
    messages: [
      { id: "local-1", text: "Hi", isUser: true },
      { ...reply, feedback },
    ],
    hydrated: true,
    active: null,
    replyId: null,
    queue: [],
    finishedId: null,
    seq: 2,
  };
  const dispatched: ChatAction[] = [];
  const dispatch = (action: ChatAction) => {
    dispatched.push(action);
    state = chatReducer(state, action);
  };
  return {
    dispatch,
    dispatched,
    rating: () => state.messages[1].feedback,
    message: () => state.messages[1],
  };
};

/** A save the test settles by hand, one request at a time, in the order they were sent. */
const manualSave = () => {
  const calls: { value: Feedback | null; resolve: () => void; reject: () => void }[] = [];
  const save = vi.fn(
    (_id: number, value: Feedback | null) =>
      new Promise<void>((resolve, reject) =>
        calls.push({ value, resolve, reject: () => reject(new Error("failed")) }),
      ),
  );
  // Lets the rater's loop take its next step.
  const settle = () => new Promise((r) => setTimeout(r, 0));
  return { save, calls, settle };
};

describe("createReplyRater", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the rating before the save answers, and keeps it once saved", async () => {
    const { dispatch, rating, message } = chat();
    const { save, calls } = manualSave();
    const pending = createReplyRater(dispatch, save)(message(), "up");
    expect(rating()).toBe("up");
    expect(save).toHaveBeenCalledWith(42, "up");
    calls[0].resolve();
    expect(await pending).toBe(true);
    expect(rating()).toBe("up");
  });

  it("puts the previous rating back when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat("down");
    const saved = await createReplyRater(dispatch, async () => {
      throw new Error("429");
    })(message(), "up");
    expect(saved).toBe(false);
    expect(rating()).toBe("down");
  });

  it("takes a rating back, and restores it if that fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat("up");
    expect(await createReplyRater(dispatch, async () => {})(message(), null)).toBe(true);
    expect(rating()).toBeNull();

    const again = chat("up");
    await createReplyRater(again.dispatch, async () => {
      throw new Error("offline");
    })(again.message(), null);
    expect(again.rating()).toBe("up");
  });

  it("sends rapid choices one at a time, the latest last", async () => {
    const { dispatch, rating, message } = chat();
    const { save, calls, settle } = manualSave();
    const rate = createReplyRater(dispatch, save);
    const first = rate(message(), "up");
    const second = rate(message(), "down");
    const third = rate(message(), null);
    const fourth = rate(message(), "down");
    expect(rating()).toBe("down");
    // Only the first is in flight; the in-between choices are never sent.
    expect(calls.map((c) => c.value)).toEqual(["up"]);
    calls[0].resolve();
    await settle();
    expect(calls.map((c) => c.value)).toEqual(["up", "down"]);
    calls[1].resolve();
    expect(await Promise.all([first, second, third, fourth])).toEqual([true, true, true, true]);
    expect(rating()).toBe("down");
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("sends nothing more when the visitor returns to the saved rating meanwhile", async () => {
    const { dispatch, rating, message } = chat();
    const { save, calls, settle } = manualSave();
    const rate = createReplyRater(dispatch, save);
    void rate(message(), "up");
    void rate(message(), "down");
    const last = rate(message(), "up");
    calls[0].resolve();
    await settle();
    expect(await last).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(rating()).toBe("up");
  });

  it("still sends a newer choice when an older save fails, and keeps it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat();
    const { save, calls, settle } = manualSave();
    const rate = createReplyRater(dispatch, save);
    const first = rate(message(), "up");
    const second = rate(message(), "down");
    calls[0].reject();
    await settle();
    // The failed "up" is not shown back: "down" is on its way.
    expect(rating()).toBe("down");
    expect(calls.map((c) => c.value)).toEqual(["up", "down"]);
    calls[1].resolve();
    expect(await Promise.all([first, second])).toEqual([true, true]);
    expect(rating()).toBe("down");
  });

  it("goes back to the last rating the server confirmed when the latest save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat();
    const { save, calls, settle } = manualSave();
    const rate = createReplyRater(dispatch, save);
    const up = rate(message(), "up");
    calls[0].resolve();
    expect(await up).toBe(true);
    // Up is confirmed. Down, then null: the first fails, the second fails too.
    const down = rate(message(), "down");
    const none = rate(message(), null);
    calls[1].reject();
    await settle();
    expect(calls.map((c) => c.value)).toEqual(["up", "down", null]);
    calls[2].reject();
    expect(await Promise.all([down, none])).toEqual([false, false]);
    expect(rating()).toBe("up");
  });

  it("does nothing for a reply the server has not saved", async () => {
    const { dispatch, dispatched } = chat();
    const save = vi.fn(async () => {});
    const unsaved = { ...reply, serverId: undefined };
    expect(await createReplyRater(dispatch, save)(unsaved, "up")).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(dispatched).toEqual([]);
  });
});

describe("saveVexFeedback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the value for that message, with the session in a header", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: 42, feedback: null }), {
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await saveVexFeedback({ messageId: 42, value: null, sessionKey: "a".repeat(32) });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/vex/messages/42/feedback/");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ value: null });
    expect((init.headers as Record<string, string>)["X-Vex-Session"]).toBe("a".repeat(32));
  });

  it("fails on a refusal, so the thumb can be put back", async () => {
    vi.stubGlobal("fetch", async () => new Response('{"code":"not_found"}', { status: 404 }));
    await expect(
      saveVexFeedback({ messageId: 42, value: "up", sessionKey: "a".repeat(32) }),
    ).rejects.toThrow();
  });
});
