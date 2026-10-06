import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type FigureFrameProps = PropsWithChildren<{
  /**
   * What the figure is. An illustration shows an idea and may be simplified;
   * a measurement shows what a model actually did. The two must never be
   * mistaken for each other, so they are framed differently: an illustration
   * on lavender behind an iris hairline, a measurement on white behind a
   * neutral one, with its label in ink.
   */
  kind: "illustration" | "measurement";
  /** The words in the frame's top edge, e.g. "Explanatory example". */
  label: string;
}>;

const frameClassName: Record<FigureFrameProps["kind"], string> = {
  illustration: "border-iris/50 bg-lavender",
  measurement: "border-border bg-card",
};

const labelClassName: Record<FigureFrameProps["kind"], string> = {
  illustration: "text-iris",
  measurement: "text-foreground",
};

/**
 * The panel a figure sits in, with its label standing in a gap in its top
 * edge — the same device as the "What to notice" box, at the size of a card.
 * A fieldset draws the gap by itself, so the label needs no painted patch
 * behind it.
 *
 * A label that wraps would straddle the edge, one line outside the card and
 * one inside, so below `sm`, where a long label can no longer fit on one
 * line, the legend floats instead: it becomes the card's first line and the
 * edge runs whole. A floated legend still names the fieldset.
 */
const FigureFrame = ({ kind, label, children }: FigureFrameProps) => (
  <fieldset
    className={cn(
      "min-w-0 rounded-card border px-5 pb-5 pt-2 max-sm:pt-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8",
      frameClassName[kind],
    )}
  >
    {/* Joined by hand, not with cn: tailwind-merge reads `text-meta` and
        `text-iris` as two colours and drops the size. */}
    <legend
      className={`ml-[-0.25rem] px-2 font-mono text-meta uppercase tracking-widest max-sm:float-left max-sm:mb-3 max-sm:ml-0 max-sm:w-full max-sm:px-0 ${labelClassName[kind]}`}
    >
      {label}
    </legend>
    <div className="max-sm:clear-both">{children}</div>
  </fieldset>
);

export default FigureFrame;
