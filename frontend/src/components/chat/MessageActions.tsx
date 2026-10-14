import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage, Feedback } from "@/lib/vexChat";

// How long the copy button shows that it copied.
const COPIED_MS = 2000;

interface MessageActionsProps {
  message: ChatMessage;
  /** A finished reply: it can be copied, and rated once the server has saved it. */
  finished: boolean;
  /** This reply failed, was stopped or said nothing, and is the last: it can be asked again. */
  canRetry: boolean;
  onRetry: () => void;
  /** Copies the reply's text and resolves with whether it did. */
  onCopy: (text: string) => Promise<boolean>;
  /** Rates the reply and resolves with whether the rating was saved. */
  onRate: (value: Feedback | null) => Promise<boolean>;
  labels: {
    replyActions: string;
    retry: string;
    copy: string;
    copied: string;
    rateUp: string;
    rateDown: string;
    rateFailed: string;
  };
}

// A 32px control with a 44px hit area (tap-target), 12px from the next so the
// hit areas meet without overlapping. Muted at rest; the lavender only where a
// pointer can hover, so it does not stay behind after a tap.
const control =
  "tap-target relative inline-flex h-8 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 ease-brand motion-reduce:transition-none [@media(hover:hover)]:hover:bg-lavender [@media(hover:hover)]:hover:text-foreground [&_svg]:size-4 [&_svg]:shrink-0";

const ARROWS: Record<string, (at: number, last: number) => number> = {
  ArrowRight: (at, last) => (at === last ? 0 : at + 1),
  ArrowLeft: (at, last) => (at === 0 ? last : at - 1),
  Home: () => 0,
  End: (_, last) => last,
};

/**
 * The controls under one of Vex's messages: "try again" on the last one when
 * it failed, copy and the thumbs on a finished reply. Always in view, muted,
 * so a reply's rhythm is the same at rest, rated or not; a message with
 * nothing to offer has no row at all. One tab stop: the arrows, Home and End
 * move along the row.
 */
const MessageActions = ({
  message,
  finished,
  canRetry,
  onRetry,
  onCopy,
  onRate,
  labels,
}: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);
  // What the last action came to, said quietly at the row's end until the
  // next one. Screen readers hear it from the chat's status region instead.
  const [note, setNote] = useState<"copied" | "rateFailed" | null>(null);
  const [current, setCurrent] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const rateable = finished && message.serverId !== undefined;
  let count = 0;
  const retryAt = canRetry ? count++ : -1;
  const copyAt = finished ? count++ : -1;
  const upAt = rateable ? count++ : -1;
  const downAt = rateable ? count++ : -1;
  if (count === 0) return null;
  // The row's one tab stop: the control last focused, while it is still there.
  const stop = Math.min(current, count - 1);
  const roving = (at: number) => ({
    tabIndex: at === stop ? 0 : -1,
    onFocus: () => setCurrent(at),
  });

  const copy = async () => {
    setNote(null);
    if (!(await onCopy(message.text))) return;
    setCopied(true);
    setNote("copied");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      setNote((now) => (now === "copied" ? null : now));
    }, COPIED_MS);
  };

  const rate = async (value: Feedback | null) => {
    setNote(null);
    if (!(await onRate(value))) setNote("rateFailed");
  };

  const thumb = (value: Feedback, label: string, Icon: typeof ThumbsUp, at: number) => {
    const pressed = message.feedback === value;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        aria-label={label}
        title={label}
        onClick={() => void rate(pressed ? null : value)}
        className={cn(control, "w-8 aria-pressed:text-iris aria-pressed:[&_svg]:fill-lavender")}
        {...roving(at)}
      >
        <Icon aria-hidden="true" />
      </button>
    );
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const move = ARROWS[event.key];
    if (!move) return;
    const buttons = [...event.currentTarget.querySelectorAll("button")];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at === -1) return;
    event.preventDefault();
    buttons[move(at, buttons.length - 1)].focus();
  };

  return (
    // Pulled 8px into the gap below: the controls' own padding already
    // separates their icons from the next message.
    <div
      role="toolbar"
      aria-label={labels.replyActions}
      onKeyDown={onKeyDown}
      className="-mb-2 flex h-8 items-center gap-3"
    >
      {canRetry && (
        <button
          type="button"
          onClick={() => {
            setNote(null);
            onRetry();
          }}
          className={cn(control, "gap-1.5 px-2 text-sm")}
          {...roving(retryAt)}
        >
          <RotateCcw aria-hidden="true" />
          {labels.retry}
        </button>
      )}
      {finished && (
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={labels.copy}
          title={labels.copy}
          className={cn(control, "w-8")}
          {...roving(copyAt)}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
      )}
      {rateable && (
        <>
          {thumb("up", labels.rateUp, ThumbsUp, upAt)}
          {thumb("down", labels.rateDown, ThumbsDown, downAt)}
        </>
      )}
      {note && (
        // Two lines at most on a phone, both within the row's 32px.
        <span
          aria-hidden="true"
          className="font-mono text-meta leading-4 text-muted-foreground duration-200 animate-in fade-in-0 motion-reduce:animate-none"
        >
          {note === "copied" ? labels.copied : labels.rateFailed}
        </span>
      )}
    </div>
  );
};

export default MessageActions;
