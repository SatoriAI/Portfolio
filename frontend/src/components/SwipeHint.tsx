import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SwipeHintProps = {
  visible: boolean;
  text: string;
  className?: string;
};

const SwipeHint: React.FC<SwipeHintProps> = ({ visible, text, className }) => {
  return (
    <div
      className={`pointer-events-none mt-3 flex w-full justify-center md:hidden ${className || ""}`}
      aria-hidden={!visible}
    >
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm",
          "border-orange-200/60 bg-orange-50/80 text-muted-foreground backdrop-blur",
          "dark:border-white/10 dark:bg-white/5",
          "transition-all duration-500",
          visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        <ChevronLeft className="h-3.5 w-3.5 opacity-70 motion-safe:animate-pulse" />
        <span>{text}</span>
        <ChevronRight className="h-3.5 w-3.5 opacity-70 motion-safe:animate-pulse" />
      </div>
    </div>
  );
};

export default SwipeHint;
