import React, { lazy, Suspense, useEffect, useId, useReducer, useRef, useState } from "react";
import { AlertCircle, Bot, MessageSquare, Send, Square, Trash2, User } from "lucide-react";

import { BrandSymbol } from "@/components/brand/BrandLogo";
import MessageActions from "@/components/chat/MessageActions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast as notify } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL } from "@/config/contact";
import { endpoints } from "@/config/endpoints";
import { useSettings } from "@/contexts/SettingsContext";
import { useLatest } from "@/hooks/use-latest";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { apiFetch } from "@/lib/apiClient";
import { copyText } from "@/lib/clipboard";
import { matchesMedia, MEDIA } from "@/lib/media";
import { markdownToPlainText } from "@/lib/text";
import {
  type ChatMessage,
  chatReducer,
  continuableReply,
  type Feedback,
  initialChatState,
  isWaiting,
  retryableQuestion,
  type StoredMessage,
  type VexAsk,
} from "@/lib/vexChat";
import {
  VEX_QUESTION_MAX_LENGTH,
  type VexErrorCode,
  vexRequestErrorCode,
  vexRetryAfterMs,
} from "@/lib/vexErrors";
import { createReplyRater, saveVexFeedback } from "@/lib/vexFeedback";
import { streamVexAnswer } from "@/lib/vexStream";
import { translations } from "@/utils/translations";

// react-markdown and its remark pipeline are the heaviest part of the widget;
// they load on first use (and on hover of the launcher, see ChatLauncher).
const MarkdownMessage = lazy(() => import("@/components/chat/MarkdownMessage"));

// Silence for this long — waiting for the first token or between tokens — is
// treated as a failure and shown as one.
const STREAM_TIMEOUT_MS = 30_000;

// The length counter appears this close to the limit, not before.
const LENGTH_COUNTER_FROM = VEX_QUESTION_MAX_LENGTH - 100;

const SESSION_STORAGE_KEY = "vex_chat_session_key";

// After a Stop, the history is read again this much later: long enough for a
// server that had already finished the answer to have saved it.
const RESYNC_AFTER_STOP_MS = 1000;

// The key goes in a header, not the URL, so it never lands in access logs.
const fetchHistory = (sessionKey: string) =>
  apiFetch<StoredMessage[]>(endpoints.vex.messages.list, {
    headers: { "X-Vex-Session": sessionKey },
  });

// Focus goes back to the composer only where that brings up no on-screen
// keyboard to cover the reply.
const focusComposer = (textarea: HTMLTextAreaElement | null) => {
  if (matchesMedia(MEDIA.finePointer)) textarea?.focus();
};

/** The fallback sentence, with the address in it as a mailto link. */
const ContactFallback = ({ sentence }: { sentence: string }) => {
  const [before, after = ""] = sentence.split("{email}");
  return (
    <>
      {before}
      <a href={`mailto:${EMAIL}`} className="text-iris underline decoration-1 underline-offset-2">
        {EMAIL}
      </a>
      {after}
    </>
  );
};

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Sent as the visitor's message once the chat is open and hydrated, after
   * any reply in flight, with where it was asked.
   */
  initialQuestion?: VexAsk | null;
  /** Called once the initial question has been taken, so it is not sent twice. */
  onInitialQuestionSent?: () => void;
}

interface MarkdownBoundaryProps {
  fallback: React.ReactNode;
  resetKey: string;
  children: React.ReactNode;
}

/** Shows a reply as plain text if its markdown fails to render, and retries when the text changes. */
class MarkdownBoundary extends React.Component<MarkdownBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.error("Markdown render error", err);
  }
  componentDidUpdate(prevProps: Readonly<MarkdownBoundaryProps>): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// A reply cut off at the limit usually ends mid-sentence; an ellipsis first
// marks the break and keeps the notice its own sentence when read aloud.
const cutShortNotice = (notice: string) => `… ${notice}.`;

const ChatWidget = ({
  isOpen,
  onClose,
  initialQuestion = null,
  onInitialQuestionSent,
}: ChatWidgetProps) => {
  const { language } = useSettings();
  const t = translations[language];
  const prefersReducedMotion = usePrefersReducedMotion();
  const [chat, dispatch] = useReducer(chatReducer, initialChatState);
  const { messages } = chat;
  // A reply is in flight from the question until its stream ends.
  const isStreaming = chat.active !== null;
  // Waiting for its first word: the typing indicator shows.
  const isLoading = isWaiting(chat);
  const [inputValue, setInputValue] = useState("");
  // A paste the length limit cut short, said once beside the counter.
  const [pasteCut, setPasteCut] = useState(false);
  const csrfTokenRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialScrollDoneRef = useRef(false);
  // Starter questions must not flash for a returning visitor whose history is
  // still being fetched, and a question waits for it (see chatReducer).
  const { hydrated } = chat;

  // A key the backend turned away (left over from an older format, or edited)
  // is dropped, so the next question starts a new conversation instead of
  // failing on the old one for good.
  const forgetSession = () => {
    csrfTokenRef.current = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  // Each load is numbered, so a slow one from an earlier open never lands
  // over the latest.
  const hydration = useRef(0);
  const hydrateMessagesIfNeeded = async () => {
    const run = ++hydration.current;
    const storedKey = localStorage.getItem(SESSION_STORAGE_KEY);
    let stored: StoredMessage[] | null = null;
    if (storedKey) {
      try {
        stored = await fetchHistory(storedKey);
      } catch (err) {
        // A rejected key has no history to load: with it gone, the chat starts
        // empty and the first question opens a new conversation.
        if (vexRequestErrorCode(err) === "invalid_session") forgetSession();
        else console.error("Failed to hydrate chat history", err);
      }
    }
    if (run === hydration.current) dispatch({ type: "hydrated", stored });
  };

  // Body scroll locking is handled by the Dialog while it is open.
  useEffect(() => {
    if (!isOpen) return;

    // Ensure the first scroll after opening is instant (no animation)
    initialScrollDoneRef.current = false;

    // Every open reloads the history (the server keeps only finished answers,
    // so one cut off by closing is gone, question and all), and a question
    // asked or handed over meanwhile waits for it in the queue: sent first, it
    // would be overwritten by the history arriving after it.
    hydrateMessagesIfNeeded();
    // Closing abandons the reply in flight (the answer effect aborts its
    // request) and marks the history stale for the next open.
    return () => dispatch({ type: "close" });
  }, [isOpen]);

  // Scroll to bottom on open and on any message or loading change
  useEffect(() => {
    if (!isOpen) return;
    // Defer to let DOM render
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        // An inline behavior overrides the CSS reduced-motion rule, so the
        // preference has to be checked here too.
        behavior: initialScrollDoneRef.current && !prefersReducedMotion ? "smooth" : "auto",
        block: "end",
      });
      if (!initialScrollDoneRef.current) initialScrollDoneRef.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, messages, isLoading, isStreaming, prefersReducedMotion]);

  // The session key, from the question POST that precedes every stream. A
  // stored key the backend refuses is replaced, once: the question goes again
  // without it and opens a new conversation.
  const openSession = async (question: string, signal: AbortSignal): Promise<string> => {
    const postQuestion = (key: string | null) => {
      const form = new FormData();
      form.append("question", question);
      if (key) form.append("session_key", key);
      return apiFetch<{ session_key: string; csrftoken: string }>(endpoints.vex.chat.post, {
        method: "POST",
        headers: csrfTokenRef.current ? { "X-CSRFToken": csrfTokenRef.current } : undefined,
        body: form as unknown as any,
        signal,
      });
    };

    const existingKey = localStorage.getItem(SESSION_STORAGE_KEY);
    let resp: { session_key: string; csrftoken: string };
    try {
      resp = await postQuestion(existingKey);
    } catch (err) {
      if (!existingKey || vexRequestErrorCode(err) !== "invalid_session") throw err;
      forgetSession();
      resp = await postQuestion(null);
    }
    csrfTokenRef.current = resp.csrftoken;
    localStorage.setItem(SESSION_STORAGE_KEY, resp.session_key);
    return resp.session_key;
  };

  // Answers one question. Every failure — a refusal, a server error, or
  // silence — ends in the same visible state: an inline notice that says why,
  // in the site's words, never the provider's, with a way to reach me instead.
  // An aborted request (the chat closed or cleared, the visitor stopped the
  // reply, or the watchdog gave up) reports nothing more. Every action names
  // its turn, so a request that outlives its turn cannot write into the next
  // one.
  const answer = async ({ question, context }: VexAsk, turn: number, signal: AbortSignal) => {
    const fail = (code: VexErrorCode, retryAt?: number) =>
      dispatch({ type: "fail", turn, code, retryAt });
    let watchdog = 0;
    const arm = () => {
      window.clearTimeout(watchdog);
      watchdog = window.setTimeout(() => fail("timeout"), STREAM_TIMEOUT_MS);
    };
    try {
      arm();
      const sessionKey = await openSession(question, signal);
      arm();
      const end = await streamVexAnswer({
        question,
        context,
        locale: language,
        sessionKey,
        csrfToken: csrfTokenRef.current,
        signal,
        onDelta: (text) => {
          arm();
          dispatch({ type: "delta", turn, text });
        },
      });
      if (signal.aborted) return;
      if (end.kind === "done")
        dispatch({ type: "done", turn, messageId: end.messageId, truncated: end.truncated });
      else fail(end.code);
    } catch (err) {
      if (signal.aborted) return;
      console.error("Chat send failed", err);
      const code = vexRequestErrorCode(err);
      // A rate limit is asked again only once it has passed.
      fail(code, code === "rate_limited" ? Date.now() + vexRetryAfterMs(err) : undefined);
    } finally {
      window.clearTimeout(watchdog);
    }
  };

  // One request per turn. Anything that ends the turn early (closing, Clear,
  // the watchdog's failure, unmounting) clears it, and the cleanup aborts the
  // request: the server sees the visitor leave and stops generating. The
  // handler is read through a ref because it closes over state.
  const answerRef = useLatest(answer);
  const turn = chat.active?.turn;
  const activeQuestion = chat.active?.question;
  // The same object for the whole turn (the reducer keeps it as it is).
  const activeContext = chat.active?.context;
  useEffect(() => {
    if (turn === undefined || activeQuestion === undefined) return;
    const controller = new AbortController();
    void answerRef.current(
      { question: activeQuestion, context: activeContext },
      turn,
      controller.signal,
    );
    return () => controller.abort();
  }, [turn, activeQuestion, activeContext, answerRef]);

  const handleSendMessage = (text?: string) => {
    const question = (text ?? inputValue).trim();
    if (!question || isStreaming) return;
    dispatch({ type: "ask", question });
    setInputValue("");
    setPasteCut(false);
    // Focus stays in the composer, also when the question came from a starter
    // button, which the conversation replaces.
    textareaRef.current?.focus();
    // Reset textarea height back to a single line
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
      }
    });
  };

  // A question handed over from the page (the hero's ask bar, a project's
  // "ask Vex about this") waits in the queue until history has loaded, so it
  // lands after any earlier conversation rather than before it, and after any
  // reply still streaming.
  useEffect(() => {
    if (!isOpen || !initialQuestion) return;
    onInitialQuestionSent?.();
    dispatch({ type: "ask", ...initialQuestion });
  }, [isOpen, initialQuestion, onInitialQuestionSent]);

  const handleClearChat = () => {
    // A history load still in flight belongs to the forgotten conversation.
    hydration.current++;
    dispatch({ type: "clear" });
    forgetSession();
    // At the top: the default corner is where the chat's composer sits.
    notify.success(t.chat.clear, { position: "top-center" });
  };

  // A short message for screen readers about a control's effect ("Copied"),
  // said once in its own polite region and then cleared.
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
  const announce = (text: string) => {
    setNotice(text);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3000);
  };

  // Reads the history once more after a Stop: if the server had saved the
  // answer before the Stop reached it, the answer replaces the stopped reply
  // (see the reducer's `synced`). A load from an earlier open or a cleared
  // conversation is dropped, like hydration's.
  const resyncTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(resyncTimer.current), []);
  const resyncAfterStop = () => {
    const run = hydration.current;
    window.clearTimeout(resyncTimer.current);
    resyncTimer.current = window.setTimeout(async () => {
      const storedKey = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!storedKey) return;
      try {
        const stored = await fetchHistory(storedKey);
        if (run === hydration.current) dispatch({ type: "synced", stored });
      } catch (err) {
        // The stopped reply stays as it is.
        console.error("Failed to re-read chat history", err);
      }
    }, RESYNC_AFTER_STOP_MS);
  };

  // Stopping ends the turn, and with it the request (see the answer effect).
  // The server saves nothing of an answer cut short, so the stopped exchange
  // is not in the history the next open loads. The button that was Stop is
  // Send again, disabled with nothing typed, so focus goes to the composer.
  const handleStop = () => {
    dispatch({ type: "stop" });
    focusComposer(textareaRef.current);
    resyncAfterStop();
  };

  // Asks the last question again; its "Try again" goes with the failed reply.
  const handleRetry = () => {
    dispatch({ type: "retry" });
    focusComposer(textareaRef.current);
  };

  // Asks Vex to go on with a reply cut off at the length cap: "Continue" as a
  // question of its own, asked from where the cut-off one was.
  const handleContinue = () => {
    dispatch({ type: "continue", question: t.chat.continue });
    focusComposer(textareaRef.current);
  };
  const continuable = continuableReply(chat);

  const handleCopy = async (text: string) => {
    const done = await copyText(text);
    if (done) announce(t.chat.copied);
    return done;
  };

  // One rater for the chat's life: it keeps each answer's saves in order. It
  // reads the session key and token as each save goes.
  const [rateReply] = useState(() =>
    createReplyRater(dispatch, async (messageId, value) => {
      const sessionKey = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionKey) throw new Error("No conversation to rate in");
      await saveVexFeedback({ messageId, value, sessionKey, csrfToken: csrfTokenRef.current });
    }),
  );
  const handleRate = async (message: ChatMessage, value: Feedback | null) => {
    const saved = await rateReply(message, value);
    if (!saved) announce(t.chat.rateFailed);
    return saved;
  };

  // A rate-limit notice offers "Try again" once the wait the server asked
  // for has passed; until then its words say to give Vex a minute.
  const waitUntil = messages[messages.length - 1]?.retryAt;
  const [waited, setWaited] = useState<number | undefined>();
  useEffect(() => {
    if (waitUntil === undefined) return;
    const id = window.setTimeout(() => setWaited(waitUntil), waitUntil - Date.now());
    return () => window.clearTimeout(id);
  }, [waitUntil]);
  const retryQuestion =
    waitUntil === undefined || waited === waitUntil ? retryableQuestion(chat) : null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const emptyState = hydrated ? (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <span
        aria-hidden="true"
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-lavender text-iris"
      >
        <MessageSquare className="h-6 w-6" />
      </span>
      <h3 className="text-xl font-semibold md:text-card-title">{t.chat.prompt}</h3>
      <ul className="mt-6 flex flex-col items-stretch gap-2">
        {t.chat.starters.map((question) => (
          <li key={question}>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start whitespace-normal text-left"
              onClick={() => handleSendMessage(question)}
              disabled={isLoading || isStreaming}
            >
              {question}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  const showEmptyState = messages.length === 0 && !isStreaming;

  // What the status region reads out once a turn finishes: the whole reply in
  // one go, rather than the log announcing it word by word as it streams.
  const finished = messages.find((m) => m.id === chat.finishedId);
  const announcement = !finished
    ? ""
    : finished.noAnswer
      ? t.chat.noAnswer
      : finished.stopped
        ? t.chat.stopped
        : `${t.chat.replied} ${markdownToPlainText(finished.text)}${finished.truncated ? cutShortNotice(t.chat.truncated) : ""}`;

  const lengthId = useId();
  const showLength = pasteCut || inputValue.length >= LENGTH_COUNTER_FROM;

  // While a reply streams the send button is Stop, in the same place.
  const sendButton = isStreaming ? (
    <Button onClick={handleStop} size="icon" aria-label={t.chat.stop} className="shrink-0">
      <Square className="fill-current" aria-hidden="true" />
    </Button>
  ) : (
    <Button
      onClick={() => handleSendMessage()}
      disabled={!inputValue.trim()}
      size="icon"
      aria-label={t.chat.send}
      // Empty, it is a quiet icon in the field; with a question, navy.
      className="shrink-0 disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-100"
    >
      <Send />
    </Button>
  );

  return (
    <Sheet
      open={isOpen}
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        lockScroll={false}
        closeLabel={t.common.close}
        aria-describedby={undefined}
        // A side panel: the page behind stays readable and clickable, and a
        // click outside must not dismiss a conversation in progress.
        onInteractOutside={(event) => event.preventDefault()}
        // While a reply streams, Escape stops it, keeping what has arrived; a
        // second Escape closes the chat as always. Closing first would throw
        // the reply away (the server keeps no unfinished answer).
        onEscapeKeyDown={(event) => {
          if (!isStreaming) return;
          event.preventDefault();
          handleStop();
        }}
        className="flex w-full flex-col gap-0 border-l border-border p-0 sm:w-[440px] sm:max-w-none lg:w-[520px]"
      >
        <header className="flex items-center justify-between border-b border-border py-3 pl-5 pr-14">
          <SheetTitle className="flex items-center gap-3 text-lg font-semibold">
            <BrandSymbol size={26} className="text-iris" />
            Vex
          </SheetTitle>
          <Button onClick={handleClearChat} variant="ghost" size="sm" aria-label={t.chat.clear}>
            <Trash2 />
            {t.chat.clear}
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 p-4">
            {showEmptyState && emptyState}
            {/* The conversation is a log, but a silent one: streamed in word
                by word, it would be read out word by word. A finished reply is
                read once by the status region below; a failure by its alert. */}
            <div role="log" aria-live="off" aria-label={t.chat.conversation} className="space-y-4">
              {messages.map((message) => {
                const bubble = (
                  <div
                    className={`prose prose-sm rounded-xl px-4 prose-headings:font-semibold prose-headings:leading-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-a:text-iris prose-a:underline prose-a:decoration-1 prose-a:underline-offset-2 prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:rounded-lg prose-pre:bg-primary prose-pre:p-3 prose-pre:text-primary-foreground prose-ol:my-2 prose-ol:ml-5 prose-ol:list-decimal prose-ul:my-2 prose-ul:ml-5 prose-ul:list-disc prose-li:my-1 prose-hr:my-3 ${
                      message.isUser
                        ? "prose-invert max-w-[85%] bg-primary py-2 text-primary-foreground"
                        : message.error
                          ? "border border-destructive/40 bg-blush py-2 text-foreground"
                          : "border border-border bg-lavender/40 py-2 text-foreground"
                    }`}
                  >
                    {message.isUser ? (
                      <p className="not-prose m-0 whitespace-pre-wrap break-words text-sm leading-6">
                        {message.text}
                      </p>
                    ) : message.noAnswer ? (
                      <p className="not-prose m-0 text-sm leading-relaxed text-muted-foreground">
                        {t.chat.noAnswer}
                      </p>
                    ) : message.error ? (
                      <p
                        role="alert"
                        className="not-prose m-0 flex items-start gap-2 text-sm leading-relaxed"
                      >
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="font-medium">{t.chat.errors[message.error]}</span>{" "}
                          <ContactFallback sentence={t.chat.errorFallback} />
                        </span>
                      </p>
                    ) : message.stopped && !message.text ? (
                      <p className="not-prose m-0 font-mono text-meta text-muted-foreground">
                        {t.chat.stopped}
                      </p>
                    ) : (
                      <>
                        <MarkdownBoundary
                          fallback={
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.text}
                            </p>
                          }
                          resetKey={`${message.id}:${message.text.length}`}
                        >
                          <Suspense
                            fallback={
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {message.text}
                              </p>
                            }
                          >
                            <MarkdownMessage
                              text={message.text}
                              streaming={message.id === chat.replyId}
                            />
                          </Suspense>
                        </MarkdownBoundary>
                        {(message.stopped || message.truncated) && (
                          <p className="not-prose mb-0 mt-2 font-mono text-meta text-muted-foreground">
                            {message.stopped ? t.chat.stopped : t.chat.truncated}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );

                return message.isUser ? (
                  <div key={message.id} className="flex justify-end gap-3">
                    {bubble}
                    <div
                      aria-hidden="true"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="group/message flex justify-start gap-3">
                    <div
                      aria-hidden="true"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-iris text-primary-foreground"
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 max-w-[85%] flex-col items-start gap-0.5">
                      {bubble}
                      <MessageActions
                        message={message}
                        finished={
                          message.id !== chat.replyId &&
                          !message.error &&
                          !message.noAnswer &&
                          !message.stopped &&
                          !message.incomplete
                        }
                        canRetry={
                          retryQuestion !== null && message === messages[messages.length - 1]
                        }
                        onRetry={handleRetry}
                        canContinue={message === continuable}
                        onContinue={handleContinue}
                        onCopy={handleCopy}
                        onRate={(value) => handleRate(message, value)}
                        labels={t.chat}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {isLoading && (
              <div className="mt-4 flex gap-3" role="status" aria-label={t.chat.typing}>
                <div
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-iris text-primary-foreground"
                >
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-xl border border-border bg-lavender/40 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-iris motion-reduce:animate-none"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-iris delay-100 motion-reduce:animate-none"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-iris delay-200 motion-reduce:animate-none"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </ScrollArea>
          <div role="status" className="sr-only">
            {announcement}
          </div>
          <div role="status" className="sr-only">
            {notice}
          </div>

          <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {/* One layout at any length: the text grows upward and the
                button keeps its corner, so nothing jumps at the second line.
                Focus is the field's own 2px iris edge; the caret marks it. */}
            <div className="flex flex-wrap items-end gap-1 rounded-card border border-control-border bg-card p-[5px] transition-colors duration-200 focus-within:border-iris focus-within:ring-1 focus-within:ring-inset focus-within:ring-iris">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value.length < VEX_QUESTION_MAX_LENGTH) setPasteCut(false);
                }}
                onPaste={(e) => {
                  // maxLength cuts a long paste without a word; this says so.
                  const el = e.currentTarget;
                  const kept = el.value.length - (el.selectionEnd - el.selectionStart);
                  const pasted = e.clipboardData.getData("text").length;
                  if (kept + pasted > VEX_QUESTION_MAX_LENGTH) setPasteCut(true);
                }}
                onKeyDown={handleKeyPress}
                aria-describedby={showLength ? lengthId : undefined}
                placeholder={t.chat.inputPlaceholder}
                aria-label={t.chat.inputLabel}
                maxLength={VEX_QUESTION_MAX_LENGTH}
                rows={1}
                // Square corners: a rounded field clips the caret at its left edge.
                className="max-h-40 min-w-0 flex-1 resize-none break-words rounded-none border-0 bg-transparent py-2.5 pl-[11px] pr-1 leading-6 text-foreground shadow-none outline-none ring-0 ring-offset-0 [overflow-wrap:anywhere] placeholder:text-muted-foreground focus:shadow-none focus:outline-none focus:placeholder:text-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                // Read-only rather than disabled while a reply streams: a
                // disabled field drops the focus to the page.
                readOnly={isStreaming}
                aria-disabled={isStreaming}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                }}
              />
              {sendButton}
              {showLength && (
                <p
                  id={lengthId}
                  className="order-last basis-full px-[11px] pb-1 font-mono text-meta text-muted-foreground"
                >
                  {pasteCut && `${t.chat.pasteCut} · `}
                  {inputValue.length}/{VEX_QUESTION_MAX_LENGTH}
                </p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatWidget;
