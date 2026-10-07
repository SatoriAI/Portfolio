import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Each sibling page's signature in miniature, beside its link on the home
 * page, moving when the reader points at or focuses the link: the home page
 * as a map of the others. Experience: a company circle settles onto the
 * timeline. Research: the new-examples line of the grokking chart draws on
 * to the top. Education: heat spreads from a point inside a drawn shape.
 * Workshop: the last line of a page types itself out behind its cursor.
 * At rest each shows its first frame, so the glyph reads without the motion;
 * under reduced motion it stays there.
 */

export type RouteKind = "experience" | "research" | "education" | "workshop";

const MOVE =
  "motion-safe:transition-[translate,stroke-dashoffset,scale,opacity] motion-safe:duration-500 motion-safe:ease-brand";

const RouteGlyph = ({ kind }: { kind: RouteKind }) => {
  // Unique per glyph, so two on one page never share a gradient or a clip.
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 32" className="h-8 w-10 shrink-0 self-center" aria-hidden="true">
      {kind === "experience" && (
        <>
          <line x1={2} y1={27} x2={38} y2={27} className="stroke-border" strokeWidth={1} />
          <circle
            cx={20}
            cy={20}
            r={6.5}
            strokeWidth={1.5}
            className={cn(
              "fill-card stroke-iris [translate:0_-7px] group-hover:[translate:0_0] group-focus-visible:[translate:0_0]",
              MOVE,
            )}
          />
        </>
      )}
      {kind === "research" && (
        <>
          <path d="M4 4V28H38" fill="none" className="stroke-border" strokeWidth={1} />
          <path
            d="M5 27C9 8 12 6 37 6"
            fill="none"
            className="stroke-muted-foreground/50"
            strokeWidth={1.5}
          />
          <path
            d="M5 27C16 27 18 7 37 7"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeWidth={1.5}
            strokeLinecap="round"
            className={cn(
              "stroke-iris [stroke-dashoffset:0.55] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]",
              MOVE,
            )}
          />
        </>
      )}
      {kind === "education" && (
        <>
          <defs>
            <radialGradient id={`${id}-heat`}>
              <stop offset="0%" stopColor="hsl(var(--lavender-deep))" stopOpacity={0.9} />
              <stop offset="60%" stopColor="hsl(var(--blush-deep))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--blush-deep))" stopOpacity={0} />
            </radialGradient>
            <clipPath id={`${id}-shape`}>
              <rect x={5} y={4} width={30} height={24} rx={3} />
            </clipPath>
          </defs>
          <circle
            cx={20}
            cy={16}
            r={16}
            fill={`url(#${id}-heat)`}
            clipPath={`url(#${id}-shape)`}
            className={cn(
              "origin-center opacity-0 [scale:0.3] [transform-box:fill-box] group-hover:opacity-100 group-hover:[scale:1] group-focus-visible:opacity-100 group-focus-visible:[scale:1]",
              MOVE,
            )}
          />
          <rect
            x={5}
            y={4}
            width={30}
            height={24}
            rx={3}
            fill="none"
            className="stroke-iris"
            strokeWidth={1.5}
          />
          <circle cx={20} cy={16} r={2} className="fill-iris" />
        </>
      )}
      {kind === "workshop" && (
        <>
          <line x1={4} y1={8} x2={36} y2={8} className="stroke-border" strokeWidth={1.5} />
          <line x1={4} y1={16} x2={30} y2={16} className="stroke-border" strokeWidth={1.5} />
          <line
            x1={4}
            y1={24}
            x2={34}
            y2={24}
            pathLength={1}
            strokeDasharray={1}
            strokeWidth={1.5}
            strokeLinecap="round"
            className={cn(
              "stroke-iris [stroke-dashoffset:0.7] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]",
              MOVE,
            )}
          />
          <rect
            x={13}
            y={19}
            width={1.5}
            height={10}
            className={cn(
              "fill-iris group-hover:[translate:22px_0] group-focus-visible:[translate:22px_0]",
              MOVE,
            )}
          />
        </>
      )}
    </svg>
  );
};

export default RouteGlyph;
