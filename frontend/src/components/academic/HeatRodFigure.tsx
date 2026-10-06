import { useEffect, useId, useMemo, useRef, useState } from "react";

import FigureFrame from "@/components/academic/FigureFrame";
import { RangeInput } from "@/components/ui/range-input";
import { useDemoRun } from "@/hooks/use-demo-run";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import {
  HOT,
  REACHED_POSITION,
  REGION_A,
  RIPPLE_MAX,
  rippleProfile,
  rodOutline,
  type RodState,
  rodState,
  sampleRod,
  shade,
  timeAt,
} from "@/lib/heatRod";

type Labels = {
  label: string;
  figure: string;
  hot: string;
  region: string;
  time: string;
  start: string;
  later: string;
  states: Record<RodState, string>;
  caption: string;
};

type Props = { labels: Labels };

/**
 * Samples along the rod, one gradient stop each. The gradient blends between
 * them, so the colour runs without steps or seams at any width.
 */
const CELLS = 240;

const percent = (x: number) => `${(x * 100).toFixed(2)}%`;

/** Room above and below the rod for its ripples, in px. */
const INSET = Math.ceil(RIPPLE_MAX) + 1;
/** One ripple cycle every 1.8 s: a shimmer, not a wobble. */
const RADIANS_PER_MS = (2 * Math.PI) / 1800;
/** The run stops a little past the moment the heat reaches A, so A shows it. */
const ROD_DEMO = { from: 0, to: Math.min(100, REACHED_POSITION + 6), durationMs: 2400 };
/** How long the ripple carries on after the heat last moved. */
const SETTLE_MS = 600;

/**
 * One rod and one process: a section that starts hot, and heat spreading
 * from it towards region A as the reader moves the slider. The two marks stay
 * put; the colour follows the slider and nothing else. The first time the
 * figure is seen, the slider runs once from start to end, so the reader sees
 * what it does before taking it. Where the rod is hot its edges ripple, as
 * hot things seem to, while the heat is moving, and settle when it stops:
 * nothing moves on its own. With reduced motion the ripples stay drawn but
 * still, and the slider does not run. The text is HTML over the drawing, so
 * it keeps its size on a phone.
 */
const HeatRodFigure = ({ labels }: Props) => {
  // React's ids carry colons, which some browsers misread inside url(#…).
  const gradientId = `rod-heat-${useId().replace(/:/g, "")}`;
  const [position, setPosition] = useState(0);
  const demo = useDemoRun<HTMLElement>(setPosition, ROD_DEMO);
  // The ripple's phase carries on from where it settled, so it never jumps.
  const phase = useRef(0);
  const t = timeAt(position);
  const cells = useMemo(() => sampleRod(t, CELLS), [t]);
  const reducedMotion = usePrefersReducedMotion();
  const rodRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<SVGPathElement>(null);
  const heatRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // The outline is drawn in px, so the ripples keep their shape at any width.
  useEffect(() => {
    const rod = rodRef.current;
    if (!rod) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(rod);
    return () => observer.disconnect();
  }, []);

  // Each frame rewrites the path directly: only the ripple's phase changes,
  // so React need not render sixty times a second. It runs for a moment
  // after each change of the heat, then settles.
  useEffect(() => {
    const rod = rodRef.current;
    const base = baseRef.current;
    const heat = heatRef.current;
    if (!rod || !base || !heat || size.width === 0) return;
    // Blur over about 12 px either side, whatever the rod's width.
    const radius = Math.max(1, Math.round((12 / size.width) * CELLS));
    const profile = rippleProfile(cells, radius);
    const amplitude = (x: number) =>
      profile[Math.min(CELLS - 1, Math.max(0, Math.floor((x / size.width) * CELLS)))];
    const draw = (phase: number) => {
      const d = rodOutline({ ...size, inset: INSET, amplitude, phase });
      base.setAttribute("d", d);
      heat.setAttribute("d", d);
    };
    draw(phase.current);
    if (reducedMotion) return;
    let frame = 0;
    let last: number | null = null;
    let settleBy: number | null = null;
    const step = (now: number) => {
      settleBy ??= now + SETTLE_MS;
      if (last !== null) phase.current += (now - last) * RADIANS_PER_MS;
      last = now;
      draw(phase.current);
      if (now < settleBy) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [cells, size, reducedMotion]);
  const state = rodState(t);
  const sentence = labels.states[state];

  return (
    <FigureFrame kind="illustration" label={labels.label}>
      <figure ref={demo.ref} aria-label={labels.figure}>
        <div className="relative py-9">
          <span
            className="absolute top-0 flex flex-col items-center"
            style={{ left: percent(HOT[0]), width: percent(HOT[1] - HOT[0]) }}
          >
            <span className="whitespace-nowrap text-xs text-foreground sm:text-sm">
              {labels.hot}
            </span>
            <span
              aria-hidden="true"
              className="mt-1 h-2 w-full border-x border-t border-foreground/60"
            />
          </span>
          <div ref={rodRef} className="relative h-8 sm:h-10">
            <svg
              width={size.width}
              height={size.height + 2 * INSET}
              viewBox={`0 0 ${size.width} ${size.height + 2 * INSET}`}
              className="absolute left-0 block overflow-visible text-iris"
              style={{ top: -INSET }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={gradientId}>
                  {cells.map((value, i) => (
                    <stop
                      key={i}
                      offset={(i + 0.5) / CELLS}
                      stopColor="currentColor"
                      stopOpacity={shade(value)}
                    />
                  ))}
                </linearGradient>
              </defs>
              {/* The same outline twice: white under the heat, so the rod reads
                  as a solid on the lavender, then the heat with the hairline
                  on top of it. */}
              <path ref={baseRef} className="fill-card" />
              <path
                ref={heatRef}
                fill={`url(#${gradientId})`}
                className="stroke-control-border"
                strokeWidth={1}
              />
            </svg>
          </div>
          <span
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: percent(REGION_A[0]), width: percent(REGION_A[1] - REGION_A[0]) }}
          >
            <span aria-hidden="true" className="mb-1 h-2 w-full border-x border-b border-primary" />
            <span className="font-mono text-sm font-semibold text-foreground">{labels.region}</span>
          </span>
        </div>
        {/* All three sentences share one grid cell and only the current one
            shows, so the cell is as tall as the longest at this width and the
            slider under it never jumps while a finger is on it. Screen readers
            hear the sentence as the slider's value instead. */}
        <div
          aria-hidden="true"
          className="mt-4 grid text-center text-base font-medium text-foreground"
        >
          {(Object.keys(labels.states) as RodState[]).map((key) => (
            <p key={key} className={`col-start-1 row-start-1 ${key === state ? "" : "invisible"}`}>
              {labels.states[key]}
            </p>
          ))}
        </div>
        <label className="mt-6 block">
          <span className="font-mono text-meta tracking-wide text-foreground">{labels.time}</span>
          <RangeInput
            aria-label={labels.time}
            min={0}
            max={100}
            step={1}
            value={position}
            onChange={(event) => {
              demo.stop();
              setPosition(Number(event.target.value));
            }}
            valueText={sentence}
          />
          <span className="flex justify-between text-xs text-muted-foreground">
            <span>{labels.start}</span>
            <span>{labels.later}</span>
          </span>
        </label>
        <figcaption className="mt-6 text-sm text-foreground/80">{labels.caption}</figcaption>
      </figure>
    </FigureFrame>
  );
};

export default HeatRodFigure;
