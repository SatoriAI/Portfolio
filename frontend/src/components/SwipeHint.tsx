import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type SwipeHintProps = {
  visible: boolean;
  text: string;
  className?: string;
};

const SwipeHint = ({ visible, text, className }: SwipeHintProps) => (
  <div
    className={cn("pointer-events-none mt-4 flex w-full justify-center md:hidden", className)}
    aria-hidden={!visible}
  >
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-meta text-muted-foreground",
        // Kit entrance: opacity and an 8px rise over 400ms on the brand easing.
        "transition-[opacity,transform] duration-400 ease-brand",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
      role="status"
      aria-live="polite"
    >
      {/* Static chevrons: the kit rules out autoplay loops, and the hint
          already announces itself by fading in. */}
      <ChevronLeft className="h-3.5 w-3.5 text-iris" />
      <span>{text}</span>
      <ChevronRight className="h-3.5 w-3.5 text-iris" />
    </div>
  </div>
);

export default SwipeHint;
