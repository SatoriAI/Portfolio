import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The one line that tells the reader a figure is theirs to operate, set
 * between the section's heading and the figure, the same everywhere: mono,
 * muted, the figure's full width, beginning "Wybierz" / "Choose", a verb that
 * holds for a mouse, a finger and a keyboard alike. The figure says the rest
 * with its own hover and focus.
 * While the reader's choice is open it fades out and keeps its line, so
 * nothing moves, and it leaves the accessibility tree with it.
 */
type ChoiceHintProps = {
  children: ReactNode;
  hidden?: boolean;
  className?: string;
  style?: CSSProperties;
};

const ChoiceHint = ({ children, hidden = false, className, style }: ChoiceHintProps) => (
  <p
    style={style}
    aria-hidden={hidden || undefined}
    className={cn(
      "mb-6 font-mono text-meta text-muted-foreground transition-opacity duration-200",
      hidden && "opacity-0",
      className,
    )}
  >
    {children}
  </p>
);

export default ChoiceHint;
