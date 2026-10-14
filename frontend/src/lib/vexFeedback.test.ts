import { afterEach, describe, expect, it, vi } from "vitest";

import { type ChatAction, type ChatMessage, chatReducer, type ChatState } from "./vexChat";
import { rateReply, saveVexFeedback } from "./vexFeedback";

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

describe("rateReply", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows the rating before the save answers, and keeps it once saved", async () => {
    const { dispatch, rating, message } = chat();
    let finish = () => {};
    const save = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const pending = rateReply(message(), "up", dispatch, save);
    expect(rating()).toBe("up");
    expect(save).toHaveBeenCalledWith(42, "up");
    finish();
    expect(await pending).toBe(true);
    expect(rating()).toBe("up");
  });

  it("puts the previous rating back when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat("down");
    const saved = await rateReply(message(), "up", dispatch, async () => {
      throw new Error("429");
    });
    expect(saved).toBe(false);
    expect(rating()).toBe("down");
  });

  it("takes a rating back, and restores it if that fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat("up");
    expect(await rateReply(message(), null, dispatch, async () => {})).toBe(true);
    expect(rating()).toBeNull();

    const again = chat("up");
    await rateReply(again.message(), null, again.dispatch, async () => {
      throw new Error("offline");
    });
    expect(again.rating()).toBe("up");
  });

  it("does not undo a newer choice when an older save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { dispatch, rating, message } = chat();
    let fail = () => {};
    const first = rateReply(
      message(),
      "up",
      dispatch,
      () => new Promise((_, reject) => (fail = () => reject(new Error("x")))),
    );
    await rateReply(message(), "down", dispatch, async () => {});
    fail();
    expect(await first).toBe(false);
    expect(rating()).toBe("down");
  });

  it("does nothing for a reply the server has not saved", async () => {
    const { dispatch, dispatched } = chat();
    const save = vi.fn(async () => {});
    const unsaved = { ...reply, serverId: undefined };
    expect(await rateReply(unsaved, "up", dispatch, save)).toBe(false);
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
