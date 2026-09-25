import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type NoticeProps = PropsWithChildren<{
  /** The framed label, e.g. "What to notice". */
  label: string;
  id?: string;
  className?: string;
}>;

/**
 * The one sentence that tells a visitor what to look for in a figure, framed:
 * a hairline box with the label standing in a gap in its top edge and the
 * sentence in italic inside. A fieldset draws exactly that — the legend cuts
 * the border by itself, on any background — so the frame needs no painted
 * patch behind the label and works on lavender, white and the colour field
 * alike. The same box precedes every interactive figure on the site.
 */
const Notice = ({ label, id, className, children }: NoticeProps) => (
  <fieldset
    id={id}
    className={cn("min-w-0 rounded-xl border border-iris/50 px-5 pb-4 pt-2", className)}
  >
    <legend className="ml-[-0.25rem] px-2 font-mono text-meta uppercase tracking-widest text-iris">
      {label}
    </legend>
    <p className="text-base italic text-foreground">{children}</p>
  </fieldset>
);

export default Notice;
