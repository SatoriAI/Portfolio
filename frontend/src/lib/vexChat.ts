// The chat's conversation state, kept free of React and the network so every
// transition can be tested directly. ChatWidget does the I/O: it answers the
// active turn and reports what the stream did as actions.

import type { VexErrorCode } from "@/lib/vexErrors";

/** A visitor's rating of one answer (vex.choices.Feedback). */
export type Feedback = "up" | "down";

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  /** Set on the inline notice appended when a request fails or stalls: why it did. */
  error?: VexErrorCode;
  /** On a rate-limit notice: when asking again may succeed (ms since the epoch). */
  retryAt?: number;
  /** Set on the inline notice appended when a reply ends without any text. */
  noAnswer?: true;
  /**
   * Set on a reply the visitor stopped: the text that had arrived (possibly
   * none). The server saves only finished answers, so a stopped exchange is
   * not in the history the next open loads, and the model never reads it back
   * (unless the answer had finished in the instant before the stop; see
   * `synced`).
   */
  stopped?: true;
  /** Set on the part of a reply that arrived before its request failed; the notice after it says why. */
  incomplete?: true;
  /** The saved answer's id on the server, which a rating names. Only finished replies have one. */
  serverId?: number;
  /** The visitor's rating of a saved answer; null when not rated. */
  feedback?: Feedback | null;
}

/** A message as the history endpoint returns it (vex.api.serializers.MessageSerializer). */
export interface StoredMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  feedback?: Feedback | null;
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
 * request sends after its turn has ended (closed, cleared, stopped, timed out)
 * is dropped rather than landing in the next one.
 */
type TurnAction =
  | { type: "delta"; turn: number; text: string }
  /** The reply is complete; messageId is the saved answer's id, when the server sent one. */
  | { type: "done"; turn: number; messageId?: number }
  /** The request failed; retryAt, for a rate limit, is when asking again may succeed. */
  | { type: "fail"; turn: number; code: VexErrorCode; retryAt?: number };

export type ChatAction =
  /** The history loaded: the stored messages, or null when there was none to load or it could not be read. */
  | { type: "hydrated"; stored: StoredMessage[] | null }
  | { type: "ask"; question: string }
  | TurnAction
  /** The visitor stopped the reply: what had arrived stays, marked as stopped. */
  | { type: "stop" }
  /**
   * The history read again after a stop. If the server had already saved the
   * answer the visitor stopped, it takes the stopped reply's place.
   */
  | { type: "synced"; stored: StoredMessage[] }
  /** Ask the last question again, in place of the reply that failed, was stopped or said nothing. */
  | { type: "retry" }
  /** Set a reply's rating. */
  | { type: "rate"; id: string; feedback: Feedback | null }
  /** The chat closed: the reply in flight and the queue are abandoned. */
  | { type: "close" }
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

// Failures that asking again could mend. A question too long, a conversation
// the server will not pick up, or a limit that lasts until tomorrow would only
// fail the same way.
const RETRYABLE_ERRORS: readonly VexErrorCode[] = ["rate_limited", "timeout", "unavailable"];

/** Where the last question stands in the conversation, or -1. */
const lastQuestionAt = (messages: ChatMessage[]): number => {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i].isUser) return i;
  return -1;
};

/**
 * The question to ask again, when the conversation ends in a reply that
 * failed, was stopped or said nothing, nothing is in flight and the history
 * has loaded; otherwise null.
 */
export function retryableQuestion(state: ChatState): string | null {
  if (state.active || !state.hydrated) return null;
  const at = lastQuestionAt(state.messages);
  const reply = state.messages[state.messages.length - 1];
  if (at === -1 || reply.isUser) return null;
  const failed =
    reply.stopped || reply.noAnswer || (reply.error && RETRYABLE_ERRORS.includes(reply.error));
  return failed ? state.messages[at].text : null;
}

/** Opens a turn for the question; `shown` when its bubble is already on screen (asked again). */
const start = (state: ChatState, question: string, shown = false): ChatState => {
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    active: { turn: seq, question },
    replyId: null,
    finishedId: null,
    messages: shown
      ? state.messages
      : [...state.messages, { id: `local-${seq}`, text: question, isUser: true }],
  };
};

/** Sends the next queued question, once the history has loaded and nothing is in flight. */
const next = (state: ChatState): ChatState => {
  const [question, ...rest] = state.queue;
  return question === undefined || state.active || !state.hydrated
    ? state
    : start({ ...state, queue: rest }, question);
};

const fromStoredMessage = (m: StoredMessage): ChatMessage =>
  m.role === "user"
    ? { id: `stored-${m.id}`, text: m.content, isUser: true }
    : {
        id: `stored-${m.id}`,
        text: m.content,
        isUser: false,
        serverId: m.id,
        feedback: m.feedback ?? null,
      };

const fromStored = (stored: StoredMessage[]): ChatMessage[] =>
  stored.filter((m) => m.role !== "system").map(fromStoredMessage);

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
    case "stop": {
      if (!state.active) return state;
      // The text that arrived stays, marked; with none yet, the mark stands
      // alone. Anything queued behind it goes too: stopping is the visitor
      // taking the floor back. Ending the turn aborts its request, and the
      // server, seeing the visitor leave, saves nothing of it. Except in a
      // race: the server saves the exchange after the last word and before it
      // sends `done`, so a Stop pressed in that instant marks as stopped an
      // answer the server has kept. The widget reads the history again after
      // a stop, and `synced` puts the saved answer back.
      const { replyId } = state;
      if (replyId) {
        return {
          ...state,
          active: null,
          replyId: null,
          queue: [],
          finishedId: replyId,
          messages: state.messages.map((m) => (m.id === replyId ? { ...m, stopped: true } : m)),
        };
      }
      const seq = state.seq + 1;
      const id = `stopped-${seq}`;
      return {
        ...state,
        seq,
        active: null,
        queue: [],
        finishedId: id,
        messages: [...state.messages, { id, text: "", isUser: false, stopped: true }],
      };
    }
    case "synced": {
      // Only while the conversation still ends in the stopped reply, and only
      // when the server holds an answer to that same question that is not on
      // screen. Anything else on screen stays as it is.
      const at = lastQuestionAt(state.messages);
      const last = state.messages[state.messages.length - 1];
      const answer = action.stored[action.stored.length - 1];
      const question = action.stored[action.stored.length - 2];
      const saved =
        !state.active &&
        at !== -1 &&
        last.stopped &&
        answer?.role === "assistant" &&
        question?.role === "user" &&
        question.content === state.messages[at].text &&
        !state.messages.some((m) => m.serverId === answer.id);
      if (!saved) return state;
      const reply = fromStoredMessage(answer);
      return {
        ...state,
        finishedId: reply.id,
        messages: [...state.messages.slice(0, at + 1), reply],
      };
    }
    case "retry": {
      const question = retryableQuestion(state);
      // The failed reply (and any part of it that arrived before the failure)
      // makes way for the new one, under the same question.
      return question === null
        ? state
        : start(
            { ...state, messages: state.messages.slice(0, lastQuestionAt(state.messages) + 1) },
            question,
            true,
          );
    }
    case "rate":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, feedback: action.feedback } : m,
        ),
      };
    case "close":
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
      const { replyId } = state;
      if (replyId) {
        const { messageId } = action;
        return next({
          ...state,
          active: null,
          replyId: null,
          finishedId: replyId,
          messages:
            messageId === undefined
              ? state.messages
              : state.messages.map((m) =>
                  m.id === replyId ? { ...m, serverId: messageId, feedback: null } : m,
                ),
        });
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
      // What arrived of the reply stays, marked as incomplete: the server
      // saved none of it.
      const seq = state.seq + 1;
      const { replyId } = state;
      return {
        ...state,
        seq,
        active: null,
        replyId: null,
        queue: [],
        messages: [
          ...state.messages.map((m) =>
            m.id === replyId ? { ...m, incomplete: true as const } : m,
          ),
          {
            id: `error-${seq}`,
            text: "",
            isUser: false,
            error: action.code,
            ...(action.retryAt === undefined ? {} : { retryAt: action.retryAt }),
          },
        ],
      };
    }
  }
}
