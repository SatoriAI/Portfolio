import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

/** Columns out of the 4-column phone grid the kit specifies. */
export type Span4 = 1 | 2 | 3 | 4;
/** Columns out of the 12-column desktop grid the kit specifies. */
export type Span12 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// Row gaps come from the kit's spacing scale (4/8/12/16/24/32/48/64/96), which
// is why this is a union rather than a number: gap-10 is now a type error.
const rowGapClassName = {
  24: "gap-y-6",
  32: "gap-y-8",
  48: "gap-y-12",
} as const;

type GridProps = ComponentPropsWithoutRef<"div"> & {
  /** Row gap in px. The column gutter is fixed at 24 and is not a prop. */
  gapY?: keyof typeof rowGapClassName;
};

/**
 * The page's one column system: 4 columns on phones, 12 from md, and a 24px
 * gutter that never changes.
 *
 * The gutter is deliberately not configurable. 24px is the only value for which
 * a nested `grid-cols-n` is identical to n equal spans of this grid — which is
 * why Skills, Projects and Contact already measured as exact spans while Hero
 * (40px) and About (48px) sat on no axis at all. Making it a prop is how that
 * drift happened; leaving it out is what stops it happening again.
 */
const Grid = ({ gapY = 24, className, ...props }: GridProps) => (
  <div
    className={cn("grid grid-cols-4 gap-x-6 md:grid-cols-12", rowGapClassName[gapY], className)}
    {...props}
  />
);

const baseSpanClassName = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
} as const;

const smSpanClassName = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
  4: "sm:col-span-4",
} as const;

const mdSpanClassName = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
} as const;

const lgSpanClassName = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
} as const;

const alignClassName = {
  start: "self-start",
  end: "self-end",
} as const;

type ColOwnProps<T extends ElementType> = {
  /** Render as another component — pass `Reveal` so the reveal is the grid item. */
  as?: T;
  /** Span out of 4, on phones. */
  span?: Span4;
  /** Span out of 4, from sm. */
  spanSm?: Span4;
  /** Span out of 12, from md. Defaults to the phone span, tripled. */
  spanMd?: Span12;
  /** Span out of 12, from lg. Defaults to the md span. */
  spanLg?: Span12;
  align?: keyof typeof alignClassName;
};

type ColProps<T extends ElementType> = ColOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ColOwnProps<T>>;

/**
 * One item of the {@link Grid}. Spans are named in columns, never in classes,
 * so a call site cannot hand the grid a layout class of its own — a class from
 * outside competes with the component's and wins only by stylesheet order.
 */
const Col = <T extends ElementType = "div">({
  as,
  span = 4,
  spanSm,
  spanMd,
  spanLg,
  align,
  className,
  ...props
}: ColProps<T>) => {
  const Tag = (as ?? "div") as ElementType;
  // The grid goes 4 -> 12 columns at md, so a span left unstated there keeps
  // the proportion it had on phones.
  const md = spanMd ?? (((spanSm ?? span) * 3) as Span12 satisfies Span12);
  const lg = spanLg ?? md;

  return (
    <Tag
      className={cn(
        baseSpanClassName[span],
        spanSm && smSpanClassName[spanSm],
        mdSpanClassName[md],
        lgSpanClassName[lg],
        align && alignClassName[align],
        className,
      )}
      {...props}
    />
  );
};

export { Col, Grid };
