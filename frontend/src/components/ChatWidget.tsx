import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, MessageSquare, Send, Trash2, User } from "lucide-react";

import { BrandSymbol } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast as notify } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { buildUrl, endpoints } from "@/config/endpoints";
import { env } from "@/config/env";
import { useSettings } from "@/contexts/SettingsContext";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { apiClient, apiFetch } from "@/lib/apiClient";
import { decodeStreamData, finalizeMarkdown } from "@/lib/streamMarkdown";
import { translations } from "@/utils/translations";

// react-markdown and its remark pipeline are the heaviest part of the widget;
// they load on first use (and on hover of the launcher, see ChatLauncher).
const MarkdownMessage = lazy(() => import("@/components/chat/MarkdownMessage"));

// Silence for this long — waiting for the first token or between tokens — is
// treated as a failure and shown as one.
const STREAM_TIMEOUT_MS = 30_000;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  /** Set on the inline notice appended when a request fails or stalls. */
  status?: "error";
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sent as the visitor's first message as soon as the chat is open and hydrated. */
  initialQuestion?: string | null;
  /** Called once the initial question has been taken, so it is not sent twice. */
  onInitialQuestionSent?: () => void;
}

class MarkdownBoundary extends React.Component<
  { fallback: React.ReactNode; resetKey: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.error("Markdown render error", err);
  }
  componentDidUpdate(
    prevProps: Readonly<{ fallback: React.ReactNode; resetKey: string; children: React.ReactNode }>,
  ): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) return this.props.fallback as any;
    return this.props.children as any;
  }
}

// Note: We previously used an error boundary fallback for markdown.
// Rendering errors are unlikely with react-markdown, and the fallback could mask formatting.
// We render markdown directly to ensure live formatting.

const ChatWidget = ({
  isOpen,
  onClose,
  initialQuestion = null,
  onInitialQuestionSent,
}: ChatWidgetProps) => {
  const { language } = useSettings();
  const t = translations[language];
  const prefersReducedMotion = usePrefersReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMultilineInput, setIsMultilineInput] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionKeyRef = useRef<string | null>(null);
  const csrfTokenRef = useRef<string | null>(null);
  const hasReceivedFirstChunkRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const initialScrollDoneRef = useRef(false);
  const watchdogRef = useRef<number | null>(null);
  // Starter questions must not flash for a returning visitor whose history is
  // still being fetched.
  const [hydrated, setHydrated] = useState(false);

  // Sample responses for demonstration - in production, this would connect to your RAG system
  const sampleResponses: { [key: string]: string } = {
    experience:
      "This developer has extensive experience in Python backend development, with a focus on building scalable systems and implementing LLM solutions. They've worked on RAG pipelines, infrastructure automation, and have handled systems processing millions of requests daily.",
    skills:
      "Their core skills include Python (expert level), database management (PostgreSQL, MongoDB, Redis), LLM integration and RAG pipeline development, and infrastructure management with AWS, Docker, and Kubernetes.",
    projects:
      "Some notable projects include an Intelligent Document RAG System using vector embeddings, a scalable backend architecture handling 1M+ daily requests, and infrastructure automation suites with comprehensive DevOps pipelines.",
    rag: "They specialize in RAG (Retrieval Augmented Generation) pipelines, having built sophisticated systems for document analysis using vector embeddings, ChromaDB, and various LLM providers. Their RAG implementations focus on accuracy and scalability.",
    default:
      "I'd be happy to help you learn more about this developer! You can ask me about their technical skills, project experience, background with LLMs and RAG systems, or anything else you'd like to know.",
  };

  const getResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("experience") || lowerMessage.includes("background")) {
      return sampleResponses.experience;
    } else if (lowerMessage.includes("skill") || lowerMessage.includes("technical")) {
      return sampleResponses.skills;
    } else if (lowerMessage.includes("project") || lowerMessage.includes("work")) {
      return sampleResponses.projects;
    } else if (
      lowerMessage.includes("rag") ||
      lowerMessage.includes("llm") ||
      lowerMessage.includes("ai")
    ) {
      return sampleResponses.rag;
    } else {
      return sampleResponses.default;
    }
  };

  const clearWatchdog = () => {
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  const closeExistingStream = () => {
    clearWatchdog();
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch {
        /* noop */
      }
      eventSourceRef.current = null;
    }
  };

  const hydrateMessagesIfNeeded = async () => {
    const storedKey = localStorage.getItem("vex_chat_session_key");
    sessionKeyRef.current = storedKey;
    if (!storedKey || env.mock) {
      setHydrated(true);
      return;
    }
    try {
      const data = await apiClient.get<any>(endpoints.vex.messages.list, {
        session: storedKey,
        ordering: "created_at",
      });
      const items: any[] = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data)
          ? data
          : [];
      if (items.length) {
        const mapped: Message[] = items.map((m, idx) => {
          const isUser = m.role === "user" || m.is_user === true || m.sender === "user";
          const text = m.text || m.content || m.message || "";
          const ts = m.created_at || m.timestamp || new Date().toISOString();
          return {
            id: String(m.id ?? idx),
            text: String(text),
            isUser,
            timestamp: new Date(ts),
          };
        });
        setMessages(mapped);
      }
    } catch (err) {
      console.error("Failed to hydrate chat history", err);
    } finally {
      setHydrated(true);
    }
  };

  // Body scroll locking is handled by the Dialog while it is open.
  useEffect(() => {
    if (!isOpen) return;

    // Ensure the first scroll after opening is instant (no animation)
    initialScrollDoneRef.current = false;

    hydrateMessagesIfNeeded();
    return () => {
      // Close stream when widget closes
      closeExistingStream();
      setIsStreaming(false);
      setIsLoading(false);
      hasReceivedFirstChunkRef.current = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      closeExistingStream();
    };
  }, []);

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

  // Every failure — request error, server error, or silence — ends in the same
  // visible state: an inline notice with a way to reach me instead. The toast
  // is only a secondary signal.
  const failConversation = (reason: string) => {
    closeExistingStream();
    setIsLoading(false);
    setIsStreaming(false);
    hasReceivedFirstChunkRef.current = false;
    setMessages((prev) => [
      ...prev,
      {
        id: `error-${Date.now()}`,
        text: t.chat.errorFallback,
        isUser: false,
        timestamp: new Date(),
        status: "error",
      },
    ]);
    notify.error(reason);
  };

  const armWatchdog = () => {
    clearWatchdog();
    watchdogRef.current = window.setTimeout(
      () => failConversation("Vex did not respond in time"),
      STREAM_TIMEOUT_MS,
    );
  };

  const handleSendMessage = async (text?: string) => {
    const question = (text ?? inputValue).trim();
    if (!question || isStreaming) return;
    const locale = localStorage.getItem("language") || "en";

    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsMultilineInput(false);
    // Reset textarea height back to a single line
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
      }
    });

    if (env.mock) {
      setIsLoading(true);
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getResponse(question),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      setIsLoading(true);
      setIsStreaming(true);
      hasReceivedFirstChunkRef.current = false;
      // Step 1-3: POST to obtain/confirm session_key (multipart/form-data)
      const form = new FormData();
      form.append("question", question);
      const existingKey = localStorage.getItem("vex_chat_session_key");
      if (existingKey) form.append("session_key", existingKey);

      const postController = new AbortController();
      const postTimeout = window.setTimeout(() => postController.abort(), STREAM_TIMEOUT_MS);
      let postResp: { session_key: string; csrftoken: string };
      try {
        postResp = await apiFetch<{ session_key: string; csrftoken: string }>(
          endpoints.vex.chat.post,
          {
            method: "POST",
            // Include CSRF token if we have one from previous round
            headers: csrfTokenRef.current ? { "X-CSRFToken": csrfTokenRef.current } : undefined,
            body: form as unknown as any,
            signal: postController.signal,
          },
        );
      } finally {
        window.clearTimeout(postTimeout);
      }

      const newSessionKey = postResp?.session_key;
      const newCsrf = postResp?.csrftoken;
      if (newSessionKey) {
        sessionKeyRef.current = newSessionKey;
        localStorage.setItem("vex_chat_session_key", newSessionKey);
      }
      if (newCsrf) {
        csrfTokenRef.current = newCsrf;
      }

      const sessionKey = sessionKeyRef.current || existingKey;
      if (!sessionKey) {
        throw new Error("No session key provided by server");
      }

      // Step 4: Open SSE stream
      closeExistingStream();
      const streamUrl = buildUrl(endpoints.vex.chat.stream, {
        question: question,
        locale: locale,
        session_key: sessionKey,
      });
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;
      armWatchdog();

      es.addEventListener("received", () => {
        // Keep typing indicator until first data chunk arrives
        armWatchdog();
      });

      es.addEventListener("finished", () => {
        clearWatchdog();
        setIsStreaming(false);
        // Finalize the last assistant message markdown once stream completes
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (!next[i].isUser) {
              next[i] = { ...next[i], text: finalizeMarkdown(next[i].text) };
              break;
            }
          }
          return next;
        });
        try {
          es.close();
        } catch {
          /* noop */
        }
        if (eventSourceRef.current === es) eventSourceRef.current = null;
      });

      es.addEventListener("error", (ev: any) => {
        // The native error event carries no payload; only a named server event
        // would, so the fallback string is the usual outcome.
        const dataMsg = typeof ev?.data === "string" ? ev.data : undefined;
        failConversation(dataMsg || "Streaming error");
      });

      es.onmessage = (e: MessageEvent) => {
        // Streamed text chunks come as default messages without an event name
        const chunk = decodeStreamData(String(e.data ?? ""));
        if (!chunk) return;
        armWatchdog();
        if (!hasReceivedFirstChunkRef.current) {
          hasReceivedFirstChunkRef.current = true;
          setIsLoading(false); // remove typing indicator once streaming starts
          // Create an assistant message to append chunks to
          const assistantMsg: Message = {
            id: `assistant-${Date.now()}`,
            text: chunk,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Append to last assistant message
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (!next[i].isUser) {
                next[i] = { ...next[i], text: next[i].text + chunk };
                break;
              }
            }
            return next;
          });
        }
      };
    } catch (err: any) {
      console.error("Chat send failed", err);
      failConversation(err?.message || "Failed to send message");
    }
  };

  // A question handed over from the page (the hero's ask bar, a project's
  // "ask Vex about this") goes out the moment history has loaded, so it lands
  // after any earlier conversation rather than before it. The handler is read
  // through a ref because it closes over state and is recreated every render.
  const sendRef = useRef(handleSendMessage);
  sendRef.current = handleSendMessage;
  useEffect(() => {
    if (!isOpen || !hydrated || !initialQuestion) return;
    onInitialQuestionSent?.();
    void sendRef.current(initialQuestion);
  }, [isOpen, hydrated, initialQuestion, onInitialQuestionSent]);

  const handleClearChat = () => {
    try {
      closeExistingStream();
    } catch {
      /* noop */
    }
    sessionKeyRef.current = null;
    csrfTokenRef.current = null;
    localStorage.removeItem("vex_chat_session_key");
    setMessages([]);
    setIsLoading(false);
    setIsStreaming(false);
    hasReceivedFirstChunkRef.current = false;
    notify.success(t.chat.clear);
  };

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
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender text-iris"
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

  const sendButton = (
    <Button
      onClick={() => handleSendMessage()}
      disabled={!inputValue.trim() || isLoading || isStreaming}
      size="icon"
      aria-label={t.chat.send}
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
        aria-describedby={undefined}
        // A side panel: the page behind stays readable and clickable, and a
        // click outside must not dismiss a conversation in progress.
        onInteractOutside={(event) => event.preventDefault()}
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
            {messages.length === 0 && !isLoading && !isStreaming ? (
              emptyState
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!message.isUser && (
                      <div
                        aria-hidden="true"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-iris text-primary-foreground"
                      >
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`prose prose-sm max-w-[85%] rounded-xl px-4 prose-headings:font-semibold prose-headings:leading-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-a:text-iris prose-a:underline prose-a:decoration-1 prose-a:underline-offset-2 prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:rounded-lg prose-pre:bg-primary prose-pre:p-3 prose-pre:text-primary-foreground prose-ol:my-2 prose-ol:ml-5 prose-ol:list-decimal prose-ul:my-2 prose-ul:ml-5 prose-ul:list-disc prose-li:my-1 prose-hr:my-3 ${
                        message.isUser
                          ? "prose-invert bg-primary py-2 text-primary-foreground"
                          : message.status === "error"
                            ? "border border-destructive/40 bg-blush py-2 text-foreground"
                            : "border border-border bg-lavender/40 py-2 text-foreground"
                      }`}
                    >
                      {message.isUser ? (
                        <p className="not-prose m-0 whitespace-pre-wrap break-words text-sm leading-6">
                          {message.text}
                        </p>
                      ) : message.status === "error" ? (
                        <p
                          role="alert"
                          className="not-prose m-0 flex items-start gap-2 text-sm leading-relaxed"
                        >
                          <AlertCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                            aria-hidden="true"
                          />
                          <span>{message.text}</span>
                        </p>
                      ) : (
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
                            <MarkdownMessage text={message.text} />
                          </Suspense>
                        </MarkdownBoundary>
                      )}
                    </div>
                    {message.isUser && (
                      <div
                        aria-hidden="true"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3" role="status" aria-label={t.chat.typing}>
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
              </div>
            )}
            <div ref={bottomRef} />
          </ScrollArea>

          <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div
              className={`relative min-h-[44px] overflow-hidden rounded-xl border border-control-border bg-card px-3 py-2 transition-colors duration-200 focus-within:border-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-iris ${isMultilineInput ? "flex flex-col gap-2" : ""}`}
            >
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t.chat.inputPlaceholder}
                aria-label={t.chat.inputPlaceholder}
                rows={1}
                className={`max-h-40 w-full resize-none break-all border-0 bg-transparent p-0 leading-6 text-foreground shadow-none outline-none ring-0 ring-offset-0 placeholder:text-muted-foreground focus:shadow-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${!isMultilineInput ? "pr-12" : ""}`}
                disabled={isLoading || isStreaming}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  const nextHeight = Math.min(el.scrollHeight, 160);
                  el.style.height = `${nextHeight}px`;
                  try {
                    const cs = window.getComputedStyle(el);
                    const lineHeight = parseFloat(cs.lineHeight || "24");
                    const valueNow = el.value;
                    const lines = Math.max(1, Math.round(nextHeight / lineHeight));
                    const shouldBecomeMulti = lines >= 2;
                    const shouldBecomeSingle = valueNow.trim().length === 0;

                    if (shouldBecomeMulti && !isMultilineInput) {
                      setIsMultilineInput(true);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = "auto";
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    } else if (shouldBecomeSingle && isMultilineInput) {
                      setIsMultilineInput(false);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = "auto";
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    }
                  } catch {
                    const valueNow = el.value;
                    const shouldBecomeMulti = nextHeight > 36; // approx >= 2 lines
                    const shouldBecomeSingle = valueNow.trim().length === 0;
                    if (shouldBecomeMulti && !isMultilineInput) {
                      setIsMultilineInput(true);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = "auto";
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    } else if (shouldBecomeSingle && isMultilineInput) {
                      setIsMultilineInput(false);
                      requestAnimationFrame(() => {
                        const rEl = textareaRef.current;
                        if (!rEl) return;
                        rEl.style.height = "auto";
                        const updated = Math.min(rEl.scrollHeight, 160);
                        rEl.style.height = `${updated}px`;
                      });
                    }
                  }
                }}
              />
              {isMultilineInput ? (
                <div className="flex items-center justify-end">{sendButton}</div>
              ) : (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">{sendButton}</div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatWidget;
