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
  /** The question being answered, numbered so each one is a new request. */
  active: { turn: number; question: string } | null;
  /** The reply to the active question, once its first text has arrived. */
  replyId: string | null;
  /** Questions handed over while a reply was in flight, sent in order after it. */
  queue: string[];
  /** Source of message ids and turn numbers. */
  seq: number;
}

export type ChatAction =
  | { type: "hydrated"; stored: StoredMessage[] }
  | { type: "ask"; question: string }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "fail"; code: VexErrorCode }
  | { type: "stop" }
  | { type: "clear" };

export const initialChatState: ChatState = {
  messages: [],
  active: null,
  replyId: null,
  queue: [],
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
    messages: [...state.messages, { id: `local-${seq}`, text: question, isUser: true }],
  };
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "hydrated":
      return {
        ...state,
        messages: action.stored
          .filter((m) => m.role !== "system")
          .map((m) => ({ id: `stored-${m.id}`, text: m.content, isUser: m.role === "user" })),
      };
    case "ask":
      return state.active
        ? { ...state, queue: [...state.queue, action.question] }
        : start(state, action.question);
    case "delta": {
      if (!state.active) return state;
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
      if (!state.active) return state;
      // A reply that ended before any text arrived simply ends: nothing to show.
      const finished: ChatState = { ...state, active: null, replyId: null };
      const [next, ...rest] = state.queue;
      return next === undefined ? finished : start({ ...finished, queue: rest }, next);
    }
    case "fail": {
      if (!state.active) return state;
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
    case "stop":
      // Closing the chat abandons the reply and anything queued behind it; the
      // history reloaded on the next open shows what the server kept.
      return { ...state, active: null, replyId: null, queue: [] };
    case "clear":
      return { ...initialChatState, seq: state.seq };
  }
}
