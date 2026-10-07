import { useId, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

import FigureFrame from "@/components/academic/FigureFrame";
import { useOnceInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { ringPoint } from "@/lib/cyclicShift";
import { cn } from "@/lib/utils";

/**
 * Addition on a clock, the task the models learned, shown on the clock
 * everyone knows: from 7, eight hours on, the hand stands at 3. The models'
 * clock has 113 hours rather than 12, which is why this one is labelled an
 * explanatory example rather than the experiment.
 *
 * The clock acts the sum out, once, the first time it is seen: the arc runs
 * from 7 round the eight hours at an even pace, each hour it passes lit as
 * if counted, past twelve to 3, where the arrowhead lands and "= 3" is
 * written. A link under the sum counts again. With reduced motion it is
 * simply drawn.
 */

/** Each hour's share of the count, so the arc and the numerals keep step. */
const HOUR_MS = 160;
const COUNT_MS = 8 * HOUR_MS;

const HOURS = 12;
const FROM = 7;
const ADD = 8;
/** The hour the hand reaches; 12 stands for 0, as on a clock face. */
const TO = (FROM + ADD) % HOURS || HOURS;

const SIZE = 120;
const C = SIZE / 2;
const FACE = 56;
const NUMERALS = 44;
const ARC = 28;

const start = ringPoint(C, ARC, FROM, HOURS);
const end = ringPoint(C, ARC, TO, HOURS);
// Clockwise (sweep 1), the long way round when the hand passes six hours.
const arcPath = `M${start.x.toFixed(1)} ${start.y.toFixed(1)} A${ARC} ${ARC} 0 ${ADD > HOURS / 2 ? 1 : 0} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;

export type ClockExampleLabels = {
  /** "Explanatory example". */
  label: string;
  /** Accessible name of the figure. */
  figure: string;
  caption: string;
  /** The link that counts the sum again. */
  replay: string;
};

type ClockExampleProps = {
  labels: ClockExampleLabels;
  className?: string;
};

/** The hours the arc passes, in order, ending on the answer. */
const PASSED = Array.from({ length: ADD }, (_, step) => (FROM + step + 1) % HOURS || HOURS);

const ClockExample = ({ labels, className }: ClockExampleProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  // 0 until first seen; each count after that is a new run, which restarts
  // the animations by remounting what they are on.
  const [run, setRun] = useState(0);
  const [landed, setLanded] = useState(false);
  const frame = useRef<HTMLElement>(null);
  const animated = !prefersReducedMotion;

  useOnceInView(frame, () => setRun(1), { threshold: 0.6, enabled: animated });

  const count = () => {
    setLanded(false);
    setRun((now) => now + 1);
  };
  // Before the first count the arc and the answer wait, unless nothing moves.
  const shown = !animated || landed;
  const arrowId = `clock-arrow-${useId().replace(/:/g, "")}`;
  const clock = (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="block h-auto w-24 shrink-0 sm:w-28"
      aria-hidden="true"
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0 0 L8 4 L0 8 Z" className="fill-iris" />
        </marker>
      </defs>
      <circle
        cx={C}
        cy={C}
        r={FACE}
        fill="none"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        className="stroke-control-border"
      />
      {Array.from({ length: HOURS }, (_, index) => {
        const hour = index === 0 ? HOURS : index;
        const { x, y } = ringPoint(C, NUMERALS, index, HOURS);
        const marked = hour === FROM || hour === TO;
        const passed = PASSED.indexOf(hour);
        return (
          <text
            key={`${hour}-${run}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            className={cn(
              "font-mono",
              marked ? "fill-foreground font-medium" : "fill-muted-foreground",
              animated && run > 0 && passed >= 0 && "animate-tick",
            )}
            style={
              animated && run > 0 && passed >= 0
                ? { animationDelay: `${(passed + 1) * HOUR_MS - HOUR_MS / 2}ms` }
                : undefined
            }
          >
            {hour}
          </text>
        );
      })}
      <path
        key={`arc-${run}`}
        d={arcPath}
        fill="none"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={animated && run === 0 ? 1 : 0}
        markerEnd={shown ? `url(#${arrowId})` : undefined}
        className={cn("stroke-iris", animated && run > 0 && "animate-draw")}
        style={
          animated && run > 0
            ? { animationDuration: `${COUNT_MS}ms`, animationTimingFunction: "linear" }
            : undefined
        }
        onAnimationEnd={() => setLanded(true)}
      />
      <circle cx={start.x} cy={start.y} r={3} className="fill-iris" />
    </svg>
  );

  return (
    <FigureFrame kind="illustration" label={labels.label}>
      <figure
        ref={frame}
        aria-label={labels.figure}
        className={cn("flex items-center gap-5", className)}
      >
        {clock}
        {/* The equation first, at the size of a card heading, so the eye lands
          on it; the description runs on from it one step below the page's
          prose at every width (15 against 16 on a phone, 16 against 18 from
          md), supporting text rather than a footnote. */}
        <figcaption className="min-w-0">
          <p className="font-mono text-[1.375rem]/tight text-foreground md:text-2xl/tight">
            {FROM} + {ADD} ={" "}
            <span
              className={cn("transition-opacity duration-200", shown ? "opacity-100" : "opacity-0")}
            >
              {TO}
            </span>
          </p>
          <p className="mt-2 text-[0.9375rem]/6 text-muted-foreground md:text-base/relaxed">
            {labels.caption}
          </p>
          {animated && (
            <button
              type="button"
              onClick={count}
              // 44px to press: the padding over the line takes the place of
              // the margin above it, and the one below is taken back.
              className="-mb-3 flex items-center gap-2 rounded-lg py-3 font-mono text-meta text-iris transition-colors duration-200 hover:text-foreground"
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              {labels.replay}
            </button>
          )}
        </figcaption>
      </figure>
    </FigureFrame>
  );
};

export default ClockExample;
