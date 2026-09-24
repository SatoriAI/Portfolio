import { type FormEvent, useState } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AskVexBarProps = {
  placeholder: string;
  /** Accessible name of the submit control. */
  submitLabel: string;
  /** Questions a visitor can send with one press, shown under the field. */
  starters?: readonly string[];
  onAsk: (question: string) => void;
  className?: string;
};

/**
 * A question to Vex, asked from the page rather than from inside the chat.
 * Submitting hands the question over and clears the field; the chat opens
 * with the answer already on its way.
 *
 * Styled as the kit's form control: 12px radius, 48px tall, control-border,
 * and the iris focus ring drawn around the whole bar rather than the bare
 * input, so the send button reads as part of the field.
 */
const AskVexBar = ({
  placeholder,
  submitLabel,
  starters = [],
  onAsk,
  className,
}: AskVexBarProps) => {
  const [value, setValue] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = value.trim();
    if (!question) return;
    onAsk(question);
    setValue("");
  };

  return (
    <div className={className}>
      <form
        onSubmit={submit}
        className="flex h-12 items-center gap-2 rounded-xl border border-control-border bg-card pl-4 pr-1.5 transition-colors duration-200 focus-within:border-foreground focus-within:outline focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-iris"
      >
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          enterKeyHint="send"
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={submitLabel}
          disabled={!value.trim()}
          className="h-9 w-9 shrink-0"
        >
          <ArrowUp className="!size-5" />
        </Button>
      </form>
      {starters.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {starters.map((question) => (
            <li key={question}>
              <button
                type="button"
                onClick={() => onAsk(question)}
                className={cn(
                  "rounded-xl border border-control-border bg-card px-3 py-1.5 text-left text-sm text-foreground transition-colors duration-200",
                  "hover:border-foreground hover:bg-lavender motion-safe:active:translate-y-px",
                )}
              >
                {question}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AskVexBar;
