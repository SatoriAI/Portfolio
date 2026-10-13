// The chat's conversation state, kept free of React and the network so every
// transition can be tested directly. ChatWidget does the I/O: it answers the
// active turn and reports what the stream did as actions.

import type { VexErrorCode } from "@/lib/vexErrors";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  /** Set on the inline notice appended when a request fails or stalls: why it did. */
  error?: VexErrorCode;
  /** Set on the inline notice appended when a reply ends without any text. */
  noAnswer?: true;
}

/** A message as the history endpoint returns it (vex.api.serializers.MessageSerializer). */
export interface StoredMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface ChatState {
  messages: ChatMessage[];
  /**
   * Whether this open's history has loaded. Until it has, questions wait in
   * the queue: one shown or sent before it would be overwritten by it.
   */
  hydrated: boolean;
  /** The question being answered, numbered so each one is a new request. */
  active: { turn: number; question: string } | null;
  /** The reply to the active question, once its first text has arrived. */
  replyId: string | null;
  /** Questions handed over while a reply was in flight or history loading, sent in order. */
  queue: string[];
  /** The message that finished the last turn (the reply, or the notice that there was none), to announce. */
  finishedId: string | null;
  /** Source of message ids and turn numbers. */
  seq: number;
}

/**
 * What the stream of one turn reported. Each carries its turn, so anything a
 * request sends after its turn has ended (closed, cleared, timed out) is
 * dropped rather than landing in the next one.
 */
type TurnAction =
  | { type: "delta"; turn: number; text: string }
  | { type: "done"; turn: number }
  | { type: "fail"; turn: number; code: VexErrorCode };

export type ChatAction =
  /** The history loaded: the stored messages, or null when there was none to load or it could not be read. */
  | { type: "hydrated"; stored: StoredMessage[] | null }
  | { type: "ask"; question: string }
  | TurnAction
  | { type: "stop" }
  | { type: "clear" };

export const initialChatState: ChatState = {
  messages: [],
  hydrated: false,
  active: null,
  replyId: null,
  queue: [],
  finishedId: null,
  seq: 0,
};

/** Waiting for the first word of a reply: the typing indicator shows. */
export const isWaiting = (state: ChatState) => state.active !== null && state.replyId === null;

const start = (state: ChatState, question: string): ChatState => {
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    active: { turn: seq, question },
    replyId: null,
    finishedId: null,
    messages: [...state.messages, { id: `local-${seq}`, text: question, isUser: true }],
  };
};

/** Sends the next queued question, once the history has loaded and nothing is in flight. */
const next = (state: ChatState): ChatState => {
  const [question, ...rest] = state.queue;
  return question === undefined || state.active || !state.hydrated
    ? state
    : start({ ...state, queue: rest }, question);
};

const fromStored = (stored: StoredMessage[]): ChatMessage[] =>
  stored
    .filter((m) => m.role !== "system")
    .map((m) => ({ id: `stored-${m.id}`, text: m.content, isUser: m.role === "user" }));

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "hydrated":
      // The history replaces what an earlier open left on screen (the server
      // keeps only finished answers). Questions wait for it, so no turn should
      // be under way; if one is, its conversation is kept rather than wiped.
      return next({
        ...state,
        hydrated: true,
        messages:
          action.stored === null || state.active ? state.messages : fromStored(action.stored),
      });
    case "ask":
      return next({ ...state, queue: [...state.queue, action.question] });
    case "stop":
      // Closing the chat abandons the reply and anything queued behind it; the
      // history reloaded on the next open shows what the server kept.
      return { ...state, hydrated: false, active: null, replyId: null, queue: [] };
    case "clear":
      // Nothing is left to load: the conversation is forgotten with the key.
      return { ...initialChatState, hydrated: true, seq: state.seq };
  }

  if (state.active?.turn !== action.turn) return state;

  switch (action.type) {
    case "delta": {
      if (state.replyId) {
        const { replyId } = state;
        return {
          ...state,
          messages: state.messages.map((m) =>
            m.id === replyId ? { ...m, text: m.text + action.text } : m,
          ),
        };
      }
      const seq = state.seq + 1;
      const replyId = `local-${seq}`;
      return {
        ...state,
        seq,
        replyId,
        messages: [...state.messages, { id: replyId, text: action.text, isUser: false }],
      };
    }
    case "done": {
      if (state.replyId) {
        return next({ ...state, active: null, replyId: null, finishedId: state.replyId });
      }
      // A reply that ended before any text: say so, rather than leave the
      // question hanging unanswered.
      const seq = state.seq + 1;
      const id = `notice-${seq}`;
      return next({
        ...state,
        seq,
        active: null,
        finishedId: id,
        messages: [...state.messages, { id, text: "", isUser: false, noAnswer: true }],
      });
    }
    case "fail": {
      // Questions waiting behind a failed one are dropped: the notice says why,
      // and sending them into a rate limit or an outage would only repeat it.
      const seq = state.seq + 1;
      return {
        ...state,
        seq,
        active: null,
        replyId: null,
        queue: [],
        messages: [
          ...state.messages,
          { id: `error-${seq}`, text: "", isUser: false, error: action.code },
        ],
      };
    }
  }
}
