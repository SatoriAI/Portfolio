// The chat's conversation state, kept free of React and the network so every
// transition can be tested directly. ChatWidget does the I/O: it answers the
// active turn and reports what the stream did as actions.

import type { VexErrorCode } from "@/lib/vexErrors";

/** A visitor's rating of one answer (vex.choices.Feedback). */
export type Feedback = "up" | "down";

/**
 * Where on the site a question was asked, sent with it so Vex knows what
 * "this" or "his contribution" means: a reference the server looks up itself
 * (vex.ai.context), never text of the client's.
 */
export type VexAskContext = { kind: "experience"; id: number } | { kind: "project"; id: number };

/** The context of a question asked from a role on the Experience page. */
export const askedFromRole = (role: { id: number }): VexAskContext => ({
  kind: "experience",
  id: role.id,
});

/** The context of a question asked from a project on the home page. */
export const askedFromProject = (project: { id: number }): VexAskContext => ({
  kind: "project",
  id: project.id,
});

/** A question to send, and where it was asked, when it came from somewhere in particular. */
export interface VexAsk {
  question: string;
  context?: VexAskContext;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  /** On a question asked from a role or a project: where, so asking it again sends that too. */
  context?: VexAskContext;
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
  /**
   * Set on a finished reply the model was cut off in, at the server's cap on
   * an answer's length: it ends mid-thought, and the last one offers to go on.
   */
  truncated?: true;
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
  /** On an answer the model was cut off in. */
  truncated?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  /**
   * Whether this open's history has loaded. Until it has, questions wait in
   * the queue: one shown or sent before it would be overwritten by it.
   */
  hydrated: boolean;
  /** The question being answered, numbered so each one is a new request. */
  active: ({ turn: number } & VexAsk) | null;
  /** The reply to the active question, once its first text has arrived. */
  replyId: string | null;
  /** Questions handed over while a reply was in flight or history loading, sent in order. */
  queue: VexAsk[];
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
  /**
   * The reply is complete; messageId is the saved answer's id, when the
   * server sent one, and truncated says the model was cut off in it.
   */
  | { type: "done"; turn: number; messageId?: number; truncated?: boolean }
  /** The request failed; retryAt, for a rate limit, is when asking again may succeed. */
  | { type: "fail"; turn: number; code: VexErrorCode; retryAt?: number };

export type ChatAction =
  /** The history loaded: the stored messages, or null when there was none to load or it could not be read. */
  | { type: "hydrated"; stored: StoredMessage[] | null }
  | ({ type: "ask" } & VexAsk)
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
  /**
   * Ask Vex to go on with the reply she was cut off in, with `question` (the
   * visitor's "Continue", in their language), asked from where its question was.
   */
  | { type: "continue"; question: string }
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

/**
 * Nothing said yet: the chat shows its starters and the AI notice. Not while
 * a history may still arrive (they would flash for a returning visitor), nor
 * once a question is on its way.
 */
export const isEmptyChat = (state: ChatState) =>
  state.hydrated && state.messages.length === 0 && state.active === null;

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

/**
 * The reply Vex can go on with: the last message, when it is a finished reply
 * she was cut off in, nothing is in flight or waiting, and the history has
 * loaded; otherwise null.
 */
export function continuableReply(state: ChatState): ChatMessage | null {
  if (state.active || state.queue.length || !state.hydrated) return null;
  const reply = state.messages[state.messages.length - 1];
  return reply?.truncated && !reply.isUser ? reply : null;
}

/** Opens a turn for the question; `shown` when its bubble is already on screen (asked again). */
const start = (state: ChatState, { question, context }: VexAsk, shown = false): ChatState => {
  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    active: { turn: seq, question, ...(context ? { context } : {}) },
    replyId: null,
    finishedId: null,
    messages: shown
      ? state.messages
      : [
          ...state.messages,
          { id: `local-${seq}`, text: question, isUser: true, ...(context ? { context } : {}) },
        ],
  };
};

/** Sends the next queued question, once the history has loaded and nothing is in flight. */
const next = (state: ChatState): ChatState => {
  const [ask, ...rest] = state.queue;
  return ask === undefined || state.active || !state.hydrated
    ? state
    : start({ ...state, queue: rest }, ask);
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
        ...(m.truncated ? { truncated: true as const } : {}),
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
    case "ask": {
      const { question, context } = action;
      return next({
        ...state,
        queue: [...state.queue, { question, ...(context ? { context } : {}) }],
      });
    }
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
      if (question === null) return state;
      // The failed reply (and any part of it that arrived before the failure)
      // makes way for the new one, under the same question, asked from the
      // same place.
      const at = lastQuestionAt(state.messages);
      const { context } = state.messages[at];
      return start(
        { ...state, messages: state.messages.slice(0, at + 1) },
        { question, ...(context ? { context } : {}) },
        true,
      );
    }
    case "continue": {
      // A follow-up of its own, under the cut-off reply, which stays as it
      // was: the model reads it back and picks up where it stopped. Asked
      // from the same role or project as the question it answers.
      if (!continuableReply(state)) return state;
      const context = state.messages[lastQuestionAt(state.messages)]?.context;
      return start(state, { question: action.question, ...(context ? { context } : {}) });
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
        const { messageId, truncated } = action;
        return next({
          ...state,
          active: null,
          replyId: null,
          finishedId: replyId,
          messages: state.messages.map((m) =>
            m.id === replyId
              ? {
                  ...m,
                  ...(messageId === undefined ? {} : { serverId: messageId, feedback: null }),
                  ...(truncated ? { truncated: true as const } : {}),
                }
              : m,
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
