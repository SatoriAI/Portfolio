import { type PropsWithChildren, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * One wire through the home page, from the theorem at the top to me at the
 * centre of the contact graph. It runs down the left margin past each
 * section's number, and current fills it as the reader scrolls: a number's
 * dot lights when the current passes it, and when the page is read to the
 * end the wire bends under the e-mail node into the hub and the circuit
 * closes there. It moves only with the reader's own scroll, never on its own:
 * the current eases after the reading line, and while it moves the lit wire
 * charges, as a battery does: bands of light run down it into the tip inside
 * a softly breathing aura, fading out shortly after the reader stops.
 *
 * The points it joins mark themselves: `data-circuit-start` (where it
 * begins), `data-circuit-node` (each section number) and `data-circuit-end`
 * (the hub, which gets `data-circuit-closed` when the current arrives).
 *
 * Only from xl up, where the margin has room for it (at lg it would run
 * 16px from the edge of the screen). Under reduced motion the
 * wire is drawn lit from end to end and does not follow the scroll.
 */

/** How far left of the section numbers the wire runs. */
const OFFSET_X = 32;
/** Where the current is: this far down the screen, a little ahead of reading. */
const READ_AT = 0.6;
/** The bends' radius, and the gap left between the wire and the hub's ring. */
const BEND = 48;
const HUB_GAP = 10;
/** How far below the hub's lower-left point the wire runs before turning in. */
const BELOW_HUB = 40;
/** Sampling step along the wire, in pixels. */
const STEP = 4;
/** How quickly the current catches up with the reading line (time constant). */
const EASE_MS = 80;
/**
 * The charging, while the current moves: bands of light run up the lit wire,
 * always faster than the current itself (a base speed in px/ms, plus a lead
 * on every pixel the current gains), so they read as flowing into the tip and
 * never drift back against the scroll; round the wire an aura breathes over
 * this period. Both keep on for a moment after the reader stops, then fade.
 * Drawn without filters or masks, which would be redrawn every frame.
 */
const SHEEN_BASE = 0.2;
const SHEEN_LEAD = 1.5;
/** The distance from one band of light to the next. */
const SHEEN_EVERY = 360;
const BREATH_MS = 1400;
const LINGER_MS = 500;
const FADE_MS = 220;
/** How near the bottom of the page counts as the bottom. */
const CLOSE_WITHIN = 12;
const WIDE = "(min-width: 1280px)";

type Layout = {
  d: string;
  /** The straight run down the margin, where the bands of light run. */
  run: string;
  height: number;
  start: { x: number; y: number };
  nodes: { x: number; y: number }[];
};

const Circuit = ({ children }: PropsWithChildren) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const gradientId = `circuit-${useId().replace(/:/g, "")}`;
  // Where the current is shown, kept across re-layouts so that a page growing
  // or a resize never empties the wire and starts it again.
  const shownRef = useRef<number | null>(null);

  // Measure the points the wire joins, relative to the wrapper, and again
  // whenever the page's height or width changes (a section loading, a resize).
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const wide = window.matchMedia(WIDE);
    const measure = () => {
      if (!wide.matches) return setLayout(null);
      const box = element.getBoundingClientRect();
      const local = (rect: DOMRect) => ({
        x: rect.left - box.left,
        y: rect.top - box.top + rect.height / 2,
      });
      const startEl = element.querySelector("[data-circuit-start]");
      const endEl = element.querySelector("[data-circuit-end]");
      const nodeEls = [...element.querySelectorAll("[data-circuit-node]")];
      if (!startEl || !endEl || nodeEls.length === 0) return setLayout(null);

      const x = local(nodeEls[0].getBoundingClientRect()).x - OFFSET_X;
      const start = { x, y: local(startEl.getBoundingClientRect()).y };
      const nodes = nodeEls.map((node) => ({ x, y: local(node.getBoundingClientRect()).y }));
      const hub = endEl.getBoundingClientRect();
      const radius = hub.width / 2 + HUB_GAP;
      const centre = { x: hub.left - box.left + hub.width / 2, y: local(hub).y };
      // Into the hub from its lower left, at 45°.
      const end = { x: centre.x - radius * Math.SQRT1_2, y: centre.y + radius * Math.SQRT1_2 };
      const turn = end.y + BELOW_HUB;
      const d = [
        `M${x} ${start.y}`,
        `V${turn - BEND}`,
        `Q${x} ${turn} ${x + BEND} ${turn}`,
        `H${end.x - 60}`,
        `Q${end.x - 12} ${turn} ${end.x} ${end.y}`,
      ].join(" ");
      const run = `M${x} ${start.y} V${turn - BEND}`;
      // Only a real change re-lays the drawing: a new object for the same
      // wire would restart it.
      setLayout((was) =>
        was && was.d === d && was.height === box.height
          ? was
          : { d, run, height: box.height, start, nodes },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    wide.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const current = useRef<SVGPathElement>(null);
  const echo = useRef<SVGPathElement>(null);
  const sheen = useRef<SVGGElement>(null);
  const sheenPaths = useRef<(SVGPathElement | null)[]>([]);
  const gradients = useRef<(SVGLinearGradientElement | null)[]>([]);
  const aura = useRef<SVGGElement>(null);
  const auraPaths = useRef<(SVGPathElement | null)[]>([]);
  const head = useRef<SVGGElement>(null);
  const halo = useRef<SVGCircleElement>(null);
  const dots = useRef<(SVGGElement | null)[]>([]);

  // The current is set straight on the drawing, frame by frame, without
  // re-rendering. It does not jump to the reading line: it eases after it
  // (on arrival it is simply where the reader is), and while it moves the wire
  // charges (the sheen and the aura), fading out shortly after the reader
  // stops. Nothing moves unless the reader has just scrolled.
  useEffect(() => {
    const element = root.current;
    const path = current.current;
    if (!element || !path || !layout) return;
    const hub = element.querySelector<HTMLElement>("[data-circuit-end]");
    const total = path.getTotalLength();

    // The length along the wire at each point, sampled once, so a scroll
    // looks up a height rather than walking the path; read between samples.
    const samples: { at: number; x: number; y: number }[] = [];
    for (let at = 0; at < total; at += STEP) {
      const point = path.getPointAtLength(at);
      samples.push({ at, x: point.x, y: point.y });
    }
    const last = path.getPointAtLength(total);
    samples.push({ at: total, x: last.x, y: last.y });
    const lengthAt = (y: number) => {
      const index = samples.findIndex((sample) => sample.y >= y);
      if (index < 0) return total;
      if (index === 0) return 0;
      const [a, b] = [samples[index - 1], samples[index]];
      return a.at + ((y - a.y) / (b.y - a.y || 1)) * (b.at - a.at);
    };
    const pointAt = (at: number) => {
      const index = Math.min(samples.length - 2, Math.floor(at / STEP));
      const [a, b] = [samples[index], samples[index + 1]];
      const share = Math.min(1, Math.max(0, (at - a.at) / (b.at - a.at || 1)));
      return { x: a.x + share * (b.x - a.x), y: a.y + share * (b.y - a.y) };
    };
    const nodeLengths = layout.nodes.map((node) => lengthAt(node.y));
    const lastNode = nodeLengths[nodeLengths.length - 1];
    const lastY = layout.nodes[layout.nodes.length - 1].y;

    const lit = [current.current, echo.current, ...auraPaths.current];
    for (const stroke of lit) stroke?.setAttribute("stroke-dasharray", String(total));
    // The bands of light run only down the straight run, which has its own length.
    const run = sheenPaths.current[0]?.getTotalLength() ?? 0;
    for (const stroke of sheenPaths.current) stroke?.setAttribute("stroke-dasharray", String(run));
    const paint = (filled: number, live: number, breath: number) => {
      for (const stroke of lit) {
        stroke?.setAttribute("stroke-dashoffset", String(total - filled));
      }
      for (const stroke of sheenPaths.current) {
        stroke?.setAttribute("stroke-dashoffset", String(run - Math.min(filled, run)));
      }
      nodeLengths.forEach((at, index) => {
        dots.current[index]?.setAttribute("data-lit", String(filled >= at - 0.5));
      });
      const closed = filled >= total - 0.5;
      if (head.current) {
        const point = pointAt(filled);
        head.current.setAttribute("transform", `translate(${point.x} ${point.y})`);
        head.current.style.opacity = closed || filled <= 0 ? "0" : "1";
      }
      halo.current?.setAttribute("r", String(6 + live * (2 + 3 * breath)));
      if (sheen.current) sheen.current.style.opacity = String(live);
      if (aura.current) aura.current.style.opacity = String(live * (0.4 + 0.6 * breath));
      if (hub) {
        if (closed) hub.setAttribute("data-circuit-closed", "");
        else hub.removeAttribute("data-circuit-closed");
      }
    };

    if (prefersReducedMotion) {
      paint(total, 0, 0);
      return () => hub?.removeAttribute("data-circuit-closed");
    }

    // Where the current should be for the page's scroll position. Down the
    // margin it follows the reading line. Past the last number the page runs
    // out before the line could reach the hub, so the rest of the wire fills
    // over the last stretch of scroll instead, closing the circuit at the
    // bottom of the page.
    const targetFor = () => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      const reading = window.scrollY + window.innerHeight * READ_AT - top;
      if (reading < lastY) return Math.min(lengthAt(reading), lastNode);
      const from = lastY + top - window.innerHeight * READ_AT;
      const to = document.documentElement.scrollHeight - window.innerHeight;
      // Within a few pixels of the bottom counts as the bottom: scroll
      // anchoring and rounding can stop the page just short of it.
      const share =
        to - from < 1 || window.scrollY >= to - CLOSE_WITHIN
          ? 1
          : (window.scrollY - from) / (to - from);
      return lastNode + Math.min(1, Math.max(0, share)) * (total - lastNode);
    };

    let target = targetFor();
    // On arrival the wire is simply where the reader is; after a re-layout it
    // carries on from where it was.
    let shown = shownRef.current ?? target;
    let live = 0;
    let travelled = 0;
    // Nothing has moved yet: the page opens still, not charging.
    let movedAt = -Infinity;
    let frame = 0;
    let then = 0;
    const step = (now: number) => {
      const dt = then ? Math.min(64, now - then) : 16;
      then = now;
      const was = shown;
      shown += (target - shown) * (1 - Math.exp(-dt / EASE_MS));
      if (Math.abs(target - shown) < 0.5) shown = target;
      shownRef.current = shown;
      const moving = shown !== target || now - movedAt < LINGER_MS;
      live += ((moving ? 1 : 0) - live) * (1 - Math.exp(-dt / FADE_MS));
      if (!moving && live < 0.01) live = 0;
      travelled += dt * SHEEN_BASE + Math.max(0, shown - was) * SHEEN_LEAD;
      const shift = `translate(0 ${travelled % SHEEN_EVERY})`;
      for (const gradient of gradients.current) gradient?.setAttribute("gradientTransform", shift);
      const breath = (Math.sin((now / BREATH_MS) * 2 * Math.PI) + 1) / 2;
      paint(shown, live, breath);
      frame = shown !== target || live > 0 ? requestAnimationFrame(step) : 0;
      if (!frame) then = 0;
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const onScroll = () => {
      target = targetFor();
      movedAt = performance.now();
      start();
    };
    shownRef.current = shown;
    paint(shown, 0, 0);
    start();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      hub?.removeAttribute("data-circuit-closed");
    };
  }, [layout, prefersReducedMotion]);

  return (
    <div ref={root} className="relative">
      {children}
      {layout && (
        <svg
          aria-hidden="true"
          data-circuit
          width="100%"
          height={layout.height}
          // Its own layer, so redrawing the wire never repaints the page.
          style={{ willChange: "transform" }}
          className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden overflow-visible xl:block"
        >
          <defs>
            {/* Bands of light every SHEEN_EVERY px down the run: a white core
                and a wider blush glow, moved along by shifting the gradient. */}
            {[
              { id: `${gradientId}-core`, colour: "hsl(var(--surface))", peak: 0.95 },
              { id: `${gradientId}-glow`, colour: "hsl(var(--blush-deep))", peak: 0.7 },
            ].map(({ id, colour, peak }, index) => (
              <linearGradient
                key={id}
                id={id}
                ref={(gradient) => {
                  gradients.current[index] = gradient;
                }}
                gradientUnits="userSpaceOnUse"
                x1={0}
                x2={0}
                y1={0}
                y2={SHEEN_EVERY}
                spreadMethod="repeat"
              >
                <stop offset="0" stopColor={colour} stopOpacity={0} />
                <stop offset="0.62" stopColor={colour} stopOpacity={0} />
                <stop offset="0.8" stopColor={colour} stopOpacity={peak} />
                <stop offset="0.86" stopColor={colour} stopOpacity={0} />
                <stop offset="1" stopColor={colour} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {/* The aura: soft strokes round the lit wire that breathe while it
              charges; plain strokes, not a blur. */}
          <g ref={aura} style={{ opacity: 0 }}>
            {[
              { width: 14, opacity: 0.06 },
              { width: 8, opacity: 0.1 },
            ].map(({ width, opacity }, index) => (
              <path
                key={width}
                ref={(stroke) => {
                  auraPaths.current[index] = stroke;
                }}
                d={layout.d}
                fill="none"
                strokeWidth={width}
                strokeLinecap="round"
                strokeDasharray="100000"
                strokeDashoffset="100000"
                opacity={opacity}
                className="stroke-iris"
              />
            ))}
          </g>
          <path d={layout.d} fill="none" strokeWidth={1} className="stroke-control-border" />
          {/* The current: iris over a blush echo, as the graph's sparks. */}
          <path
            ref={echo}
            d={layout.d}
            fill="none"
            strokeWidth={2}
            strokeDasharray="100000"
            strokeDashoffset="100000"
            transform="translate(1.5 1.5)"
            className="stroke-blush-deep"
          />
          <path
            ref={current}
            d={layout.d}
            fill="none"
            strokeWidth={2}
            strokeDasharray="100000"
            strokeDashoffset="100000"
            className="stroke-iris"
          />
          {/* The sheen: bands of light running down the lit run. */}
          <g ref={sheen} style={{ opacity: 0 }}>
            {[
              { width: 7, id: `${gradientId}-glow` },
              { width: 2.5, id: `${gradientId}-core` },
            ].map(({ width, id }, index) => (
              <path
                key={id}
                ref={(stroke) => {
                  sheenPaths.current[index] = stroke;
                }}
                d={layout.run}
                fill="none"
                strokeWidth={width}
                strokeLinecap="round"
                strokeDasharray="100000"
                strokeDashoffset="100000"
                stroke={`url(#${id})`}
              />
            ))}
          </g>
          <g transform={`translate(${layout.start.x} ${layout.start.y})`}>
            <circle r={9} className="fill-iris/15" />
            <circle r={4.5} className="fill-iris" />
          </g>
          {layout.nodes.map((node, index) => (
            <g
              key={index}
              ref={(dot) => {
                dots.current[index] = dot;
              }}
              data-lit="false"
              transform={`translate(${node.x} ${node.y})`}
              className="group"
            >
              <circle
                r={9}
                className="fill-iris/15 opacity-0 transition-opacity duration-200 group-data-[lit=true]:opacity-100"
              />
              <circle
                r={4.5}
                strokeWidth={1.5}
                className="fill-background stroke-control-border transition-colors duration-200 group-data-[lit=true]:fill-iris group-data-[lit=true]:stroke-iris"
              />
            </g>
          ))}
          {/* Where the current has got to. */}
          <g ref={head} style={{ opacity: 0 }}>
            <circle ref={halo} r={6} className="fill-blush-deep/70" />
            <circle r={3} className="fill-iris" />
          </g>
        </svg>
      )}
    </div>
  );
};

export default Circuit;
