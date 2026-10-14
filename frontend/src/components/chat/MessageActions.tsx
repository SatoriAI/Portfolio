import { useEffect, useRef, useState } from "react";
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatMessage, Feedback } from "@/lib/vexChat";

// How long the copy button says it copied.
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
  onRate: (value: Feedback | null) => void;
  labels: {
    retry: string;
    copy: string;
    copied: string;
    rateUp: string;
    rateDown: string;
  };
}

// Quiet until wanted: where there is a pointer to hover with, a control shows
// while the pointer is over its message or focus is inside it; on touch it is
// always there. It fades rather than appears, and its room is kept either way,
// so nothing moves when it shows.
const quiet =
  "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/message:opacity-100 [@media(hover:hover)]:group-focus-within/message:opacity-100";

// A 32px control with a 44px hit area (tap-target), 12px from the next so the
// hit areas meet without overlapping.
const control =
  "tap-target relative inline-flex h-8 items-center justify-center rounded-xl text-muted-foreground transition-[color,background-color,opacity] duration-200 ease-brand hover:bg-lavender hover:text-foreground motion-reduce:transition-none [&_svg]:size-4 [&_svg]:shrink-0";

/**
 * The controls under one of Vex's messages: copy and the thumbs on a finished
 * reply, "try again" on the last one when it failed. The row is always there,
 * empty or not, so a reply finishing never pushes the conversation about.
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
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await onCopy(message.text))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  const thumb = (value: Feedback, label: string, Icon: typeof ThumbsUp) => {
    const pressed = message.feedback === value;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        aria-label={label}
        title={label}
        onClick={() => onRate(pressed ? null : value)}
        // The chosen thumb stays in view: it is the visitor's answer.
        className={cn(
          control,
          "w-8 aria-pressed:text-iris aria-pressed:[&_svg]:fill-lavender",
          !pressed && quiet,
        )}
      >
        <Icon aria-hidden="true" />
      </button>
    );
  };

  return (
    <div className="flex h-8 items-center gap-3">
      {canRetry && (
        <button type="button" onClick={onRetry} className={cn(control, "gap-1.5 px-2 text-sm")}>
          <RotateCcw aria-hidden="true" />
          {labels.retry}
        </button>
      )}
      {finished && (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? labels.copied : labels.copy}
          title={copied ? labels.copied : labels.copy}
          className={cn(control, "w-8", !copied && quiet)}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
      )}
      {finished && message.serverId !== undefined && (
        <>
          {thumb("up", labels.rateUp, ThumbsUp)}
          {thumb("down", labels.rateDown, ThumbsDown)}
        </>
      )}
    </div>
  );
};

export default MessageActions;
