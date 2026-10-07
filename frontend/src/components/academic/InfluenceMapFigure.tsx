import { useEffect, useId, useRef } from "react";

import FigureFrame from "@/components/academic/FigureFrame";
import { RangeInput } from "@/components/ui/range-input";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { discStops, heatRadius, spreadAt, strengthAt, wavyRim } from "@/lib/kernelFigures";

type FigureLabels = {
  label: string;
  figure: string;
  impulse: string;
  observation: string;
  tip: string;
  boundary: string;
  caption: string;
};

type ControlLabels = {
  time: string;
  start: string;
  later: string;
};

/**
 * The cone, drawn as a solid seen from the side: the tip at the top, the
 * slanted sides its boundary, the base an ellipse whose far half is dashed.
 * The viewBox is small so its labels stay near their CSS size on a phone,
 * and the drawing stops growing at 400px so a tablet does not blow it up.
 */
const TIP = { x: 180, y: 26 };
const BASE = { cx: 180, cy: 248, rx: 128, ry: 24 };
const CONE = `M${TIP.x} ${TIP.y}L${BASE.cx - BASE.rx} ${BASE.cy}A${BASE.rx} ${BASE.ry} 0 0 0 ${BASE.cx + BASE.rx} ${BASE.cy}Z`;
const FAR_BASE = `M${BASE.cx - BASE.rx} ${BASE.cy}A${BASE.rx} ${BASE.ry} 0 0 1 ${BASE.cx + BASE.rx} ${BASE.cy}`;

/** Where the pulse begins: inside, left of centre. */
const IMPULSE = { x: 146, y: 186 };
const PULSE_RADIUS = 7;
/** How long the rim stirs after the heat last moved. */
const SETTLE_MS = 600;

/** Where the influence is observed: fixed, deep inside, away from the pulse. */
const OBSERVED = { x: 234, y: 212 };
/** The observation ring's dashes, in drawing units, and its radius. */
const RING_RADIUS = 10;
const RING_DASH = "4 3";

type FigureProps = { labels: FigureLabels; position: number };

/**
 * A map of influence on a cone: a pulse of heat, a place to observe it, and
 * time. The influence is one disc of iris heat, darkest at the pulse, that
 * widens and pales as the time runs — no numbers, since none of it is the
 * Jacobi kernel. Its rim is gently irregular, and stirs while the heat moves,
 * settling when it stops; still with reduced motion. The
 * pulse is a plain dot; the observation point stays where it is, a dashed
 * ring round a dot. The time control is a separate component, so the page
 * can set it beside the prose.
 */
const InfluenceMapFigure = ({ labels, position }: FigureProps) => {
  const id = useId().replace(/:/g, "");
  const spread = spreadAt(position);
  const radius = heatRadius(spread);
  const stops = discStops(strengthAt(spread));
  const discRef = useRef<SVGPathElement>(null);
  // The rim's time carries on from where it settled, so it never jumps; the
  // drawing below starts from it too.
  const rimTime = useRef(0);
  const reducedMotion = usePrefersReducedMotion();

  // For a moment after each change of the heat, each frame rewrites the
  // disc's outline directly, so React need not render sixty times a second;
  // then the rim settles. Nothing moves on its own.
  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    let last: number | null = null;
    let settleBy: number | null = null;
    const step = (now: number) => {
      settleBy ??= now + SETTLE_MS;
      if (last !== null) rimTime.current += (now - last) / 1000;
      last = now;
      discRef.current?.setAttribute("d", wavyRim(IMPULSE.x, IMPULSE.y, radius, rimTime.current));
      if (now < settleBy) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [radius, reducedMotion]);

  return (
    <FigureFrame kind="illustration" label={labels.label}>
      <figure aria-label={labels.figure}>
        <svg
          viewBox="0 0 360 290"
          className="mx-auto block h-auto w-full max-w-[400px]"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`${id}-cone`}>
              <path d={CONE} />
            </clipPath>
            <radialGradient
              id={`${id}-heat`}
              gradientUnits="userSpaceOnUse"
              cx={IMPULSE.x}
              cy={IMPULSE.y}
              r={radius * 1.1}
            >
              {stops.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  className="text-iris"
                  stopColor="currentColor"
                  stopOpacity={stop.opacity}
                />
              ))}
            </radialGradient>
          </defs>

          <path d={CONE} className="fill-card" />
          <g clipPath={`url(#${id}-cone)`}>
            <path
              ref={discRef}
              d={wavyRim(IMPULSE.x, IMPULSE.y, radius, rimTime.current)}
              fill={`url(#${id}-heat)`}
              className="stroke-iris/40"
              strokeWidth={1}
            />
          </g>
          <path d={FAR_BASE} fill="none" className="stroke-foreground/30" strokeDasharray="4 4" />
          <path d={CONE} fill="none" className="stroke-foreground/60" strokeWidth={1.25} />

          <g className="fill-muted-foreground text-[17px]">
            <text x={TIP.x + 14} y={TIP.y + 4}>
              {labels.tip}
            </text>
            <text x={254} y={128}>
              {labels.boundary}
            </text>
          </g>

          <circle cx={IMPULSE.x} cy={IMPULSE.y} r={PULSE_RADIUS} className="fill-primary" />
          <g transform={`translate(${OBSERVED.x} ${OBSERVED.y})`}>
            <circle
              r={RING_RADIUS}
              fill="none"
              className="stroke-primary"
              strokeWidth={2}
              strokeDasharray={RING_DASH}
            />
            <circle r={2.5} className="fill-primary" />
          </g>
        </svg>

        <ul className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-foreground/80">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary" />
            {labels.impulse}
          </li>
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-4 w-4">
              <circle
                r={RING_RADIUS}
                fill="none"
                className="stroke-primary"
                strokeWidth={2}
                strokeDasharray={RING_DASH}
              />
              <circle r={2.5} className="fill-primary" />
            </svg>
            {labels.observation}
          </li>
        </ul>

        <figcaption className="mt-6 text-sm text-foreground/80">{labels.caption}</figcaption>
      </figure>
    </FigureFrame>
  );
};

type ControlsProps = {
  labels: ControlLabels;
  position: number;
  onPositionChange: (position: number) => void;
};

/** How long after the pulse: set beside the prose. */
export const InfluenceMapControls = ({ labels, position, onPositionChange }: ControlsProps) => (
  <label className="block">
    <span className="font-mono text-meta tracking-wide text-foreground">{labels.time}</span>
    <RangeInput
      aria-label={labels.time}
      min={0}
      max={1}
      step={0.005}
      value={position}
      onChange={(event) => onPositionChange(Number(event.target.value))}
      valueText={`${Math.round(position * 100)}%`}
    />
    <span className="flex justify-between text-xs text-muted-foreground">
      <span>{labels.start}</span>
      <span>{labels.later}</span>
    </span>
  </label>
);

export default InfluenceMapFigure;
