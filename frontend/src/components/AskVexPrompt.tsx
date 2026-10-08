import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Asking Vex, made to look like what it is: the chat's own input, already
 * holding the question it will send. The whole pill sends it. Used wherever
 * the site offers to ask Vex about something in particular (a project, a
 * role), so it reads the same everywhere.
 */
const AskVexPrompt = ({
  question,
  shown,
  label,
  onAsk,
  className,
}: {
  /** What is sent to the chat. */
  question: string;
  /** The question as the pill shows it, e.g. in quotation marks. */
  shown: string;
  /** The control's accessible name, e.g. "Ask Vex about Xperi". */
  label: string;
  onAsk: (question: string) => void;
  className?: string;
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={() => onAsk(question)}
    className={cn(
      "group flex min-h-11 w-full items-center gap-3 rounded-lg border border-control-border bg-background py-1.5 pl-4 pr-1.5 text-left outline-none transition-colors duration-200 hover:border-iris focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className,
    )}
  >
    <span className="shrink-0 font-mono text-meta text-iris">Vex</span>
    <span className="min-w-0 flex-1 text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground sm:truncate">
      {shown}
    </span>
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
    >
      <ArrowUp className="size-4" />
    </span>
  </button>
);

export default AskVexPrompt;
