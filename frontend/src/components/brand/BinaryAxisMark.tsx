import { useState } from "react";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

/**
 * The Binary Axis symbol at a size where it can be studied, with its second
 * layer one gesture away.
 *
 * The kit describes the mark as `0 · 1 → dh`: the bowl of the d is a circle
 * and reads as zero, the shared vertical reads as one, and a single curve
 * completes the h. Nothing on the site had ever said so. Hover, focus or tap
 * and the reading is annotated: a hairline iris circle draws round the bowl,
 * a hairline draws along the axis, and the three labels appear. The mark
 * itself is never altered — the kit forbids recolouring a stroke or adding an
 * effect to it — so the annotation is drawn beside and around it and goes away
 * again, leaving the initials as the first reading.
 *
 * Path data is the kit's standard cut, unchanged. Guides use
 * `vector-effect: non-scaling-stroke` so they stay the 1px of the rhythm motif
 * at any rendered size.
 *
 * On first sight the mark draws itself: the bowl first, then the shoulder,
 * the order a hand would take. That is an entrance, not an effect on the
 * mark — the finished form is exactly the kit's — and it is skipped under
 * reduced motion or when the mark is already on screen at load.
 */

const BOWL = "M49 18V77H31A17.5 17.5 0 0 1 31 42H49";
const SHOULDER = "M49 57C55 43 75 42 82 55V77";
/** Centre and radius of the bowl's arc: the circle the zero reading refers to. */
const BOWL_CENTRE = { x: 31, y: 59.5 };
const HALO_RADIUS = 25;

export type BinaryAxisLabels = {
  /** Accessible name of the toggle, e.g. "Show how the mark reads as 0 and 1". */
  toggle: string;
  zero: string;
  one: string;
  /** The completed reading, e.g. "→ dh". */
  reading: string;
};

type BinaryAxisMarkProps = {
  labels: BinaryAxisLabels;
  className?: string;
};

const BinaryAxisMark = ({ labels, className }: BinaryAxisMarkProps) => {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = pinned || hovered || focused;
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLButtonElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animateEntrance || isRevealed;
  const strokeClassName = cn(
    animateEntrance && "transition-[stroke-dashoffset] duration-700 ease-brand",
    drawn ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
  );

  const guideClassName = cn(
    "stroke-iris transition-[stroke-dashoffset,opacity] duration-400 ease-brand motion-reduce:transition-none",
    open ? "opacity-100 [stroke-dashoffset:0]" : "opacity-0 [stroke-dashoffset:1]",
  );
  const labelClassName = cn(
    "fill-iris font-mono transition-opacity duration-400 ease-brand motion-reduce:transition-none",
    open ? "opacity-100" : "opacity-0",
  );
  // Labels follow the guides in reading order; on the way out they leave together.
  const labelDelay = (delayMs: number) => ({ transitionDelay: open ? `${delayMs}ms` : "0ms" });

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pinned}
      aria-label={labels.toggle}
      onClick={() => setPinned((value) => !value)}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        "block w-full max-w-[22rem] rounded-card text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background",
        className,
      )}
    >
      <svg viewBox="-14 -12 140 118" className="block h-auto w-full" aria-hidden="true">
        {/* Annotation, under the mark so the ink always wins where they cross. */}
        <g fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke">
          <circle
            cx={BOWL_CENTRE.x}
            cy={BOWL_CENTRE.y}
            r={HALO_RADIUS}
            pathLength={1}
            strokeDasharray={1}
            vectorEffect="non-scaling-stroke"
            className={guideClassName}
          />
          <line
            x1={49}
            y1={4}
            x2={49}
            y2={92}
            pathLength={1}
            strokeDasharray={1}
            vectorEffect="non-scaling-stroke"
            className={guideClassName}
          />
        </g>
        <g fontSize={9} className="select-none">
          <text
            x={BOWL_CENTRE.x - HALO_RADIUS - 6}
            y={BOWL_CENTRE.y}
            textAnchor="end"
            dominantBaseline="middle"
            className={labelClassName}
            style={labelDelay(80)}
          >
            {labels.zero}
          </text>
          <text
            x={49}
            y={-6}
            textAnchor="middle"
            className={labelClassName}
            style={labelDelay(160)}
          >
            {labels.one}
          </text>
          <text
            x={108}
            y={98}
            textAnchor="middle"
            className={labelClassName}
            style={labelDelay(240)}
          >
            {labels.reading}
          </text>
        </g>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={8.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={BOWL} pathLength={1} strokeDasharray={1} className={strokeClassName} />
          <path
            d={SHOULDER}
            pathLength={1}
            strokeDasharray={1}
            className={strokeClassName}
            style={animateEntrance ? { transitionDelay: "500ms" } : undefined}
          />
        </g>
      </svg>
    </button>
  );
};

export default BinaryAxisMark;
