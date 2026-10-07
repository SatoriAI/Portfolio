import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { splitLastWord } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * A title whose last word keeps what follows it (the arrow of a link) on its
 * own line, so the arrow never wraps onto a line by itself.
 */
const KeepWithLastWord = ({ text, children }: { text: string; children: ReactNode }) => {
  const [head, last] = splitLastWord(text);
  return (
    <>
      {head}
      <span className="whitespace-nowrap">
        {last}
        {children}
      </span>
    </>
  );
};

/** The arrow after a linked title, nudged on by its group's hover. */
export const TitleArrow = ({ className }: { className?: string }) => (
  <ArrowRight
    aria-hidden="true"
    className={cn(
      "ml-2 inline -translate-y-px align-middle text-iris transition-transform duration-200",
      className,
    )}
  />
);

export default KeepWithLastWord;
