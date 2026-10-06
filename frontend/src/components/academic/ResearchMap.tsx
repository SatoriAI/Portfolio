import { type MouseEvent, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import {
  drift,
  EDGES,
  layoutFor,
  type NodeKey,
  type Point,
  SEEDS,
  trim,
  wrapLabel,
} from "@/lib/researchMap";

type Labels = {
  label: string;
  kernels: string;
  reasoning: string;
  quantum: string;
  harmonic: string;
  functional: string;
};

type Props = { labels: Labels };

/** The three topics, each a way into its section. */
const TOPICS = {
  kernels: { href: "#kernels", index: "01" },
  reasoning: { href: "#transformers", index: "02" },
  quantum: { href: "#jacobi-quantum", index: "03" },
} as const;

type TopicKey = keyof typeof TOPICS;

/**
 * Links inside an SVG update the address but do not scroll to the target, so
 * the map scrolls itself, the same way the site header does, and keeps the
 * section in the address for sharing and Back.
 */
const goTo = (href: string) => (event: MouseEvent<Element>) => {
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  event.preventDefault();
  window.history.pushState(null, "", href);
  target.scrollIntoView({ block: "start" });
};
const isTopic = (key: NodeKey): key is TopicKey => key in TOPICS;

const NODES: readonly NodeKey[] = ["kernels", "harmonic", "reasoning", "functional", "quantum"];

const TOPIC_RADIUS = 28;
const FIELD_RADIUS = 10;
const radiusOf = (key: NodeKey) => (isTopic(key) ? TOPIC_RADIUS : FIELD_RADIUS);
/** How far a node drifts from its resting place, in px. */
const driftOf = (key: NodeKey) => (isTopic(key) ? 5 : 4);
const LINE = 18;

/**
 * The research as a plain node-and-link graph. The three topics are the
 * large navy circles and link to their sections; the two fields of
 * mathematics are small grey circles between the topics they join, and are
 * not links themselves: they explain the joins, they are not places to go.
 * Harmonic analysis sits at the centre. Every link is the same straight line.
 *
 * The nodes drift slowly and the lines follow; nothing else moves. The loop
 * pauses off screen, and with reduced motion the graph stays still.
 */
const ResearchMap = ({ labels }: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const layout = layoutFor(width);
  const { height } = layout;

  const groups = useRef<Partial<Record<NodeKey, SVGGElement | null>>>({});
  const edges = useRef<(SVGLineElement | null)[]>([]);

  /** How far a node reaches from its centre. */
  const reach = (key: NodeKey) => radiusOf(key) + 2;
  // A node rests where its layout puts it, but never so near an edge that
  // it, or its drift, would be cut off on a narrow phone.
  const home = (key: NodeKey): Point => {
    const margin = reach(key) + driftOf(key);
    return {
      x: Math.min(width - margin, Math.max(margin, layout.at[key].x * width)),
      y: layout.at[key].y * height,
    };
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // Measure at once, not only when the observer first reports: a page that
    // is not being painted (a background tab) may not report until it is.
    setWidth(wrap.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || width === 0) return;
    const draw = (time: number) => {
      const at = {} as Record<NodeKey, Point>;
      for (const key of NODES) {
        const rest = home(key);
        const move = drift(time, SEEDS[key], driftOf(key));
        at[key] = { x: rest.x + move.x, y: rest.y + move.y };
        groups.current[key]?.setAttribute("transform", `translate(${at[key].x} ${at[key].y})`);
      }
      EDGES.forEach(([a, b], i) => {
        const { start, end } = trim(at[a], at[b], radiusOf(a) + 3, radiusOf(b) + 3);
        const line = edges.current[i];
        line?.setAttribute("x1", String(start.x));
        line?.setAttribute("y1", String(start.y));
        line?.setAttribute("x2", String(end.x));
        line?.setAttribute("y2", String(end.y));
      });
    };
    draw(0);
    if (reducedMotion) return;
    let frame = 0;
    let begin: number | null = null;
    const step = (now: number) => {
      begin ??= now;
      draw((now - begin) / 1000);
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) frame = requestAnimationFrame(step);
    });
    observer.observe(wrap);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // `home` reads width and layout, both listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, layout, reducedMotion]);

  /** A node's label, on the side its layout gives it. */
  const label = (key: NodeKey) => {
    const topic = isTopic(key);
    const r = radiusOf(key);
    const side = layout.labels[key];
    // A topic's name keeps to one line where the map has room for it; a name
    // to the right of its node wraps to the width left beside it.
    const charWidth = topic ? 9 : 7;
    const besideChars = Math.floor((width - home(key).x - r - 14) / charWidth);
    const topicChars = width < 520 ? 14 : 24;
    const lines = wrapLabel(
      labels[key],
      side === "right" ? Math.max(10, besideChars) : topic ? topicChars : 22,
    );
    const className = topic
      ? "fill-foreground text-[16px] font-semibold"
      : "fill-muted-foreground text-[13px]";
    if (side === "right") {
      const top = -((lines.length - 1) * LINE) / 2;
      return (
        <text x={r + 10} y={top} dominantBaseline="middle" className={className}>
          {lines.map((line, i) => (
            <tspan key={i} x={r + 10} dy={i === 0 ? 0 : LINE}>
              {line}
            </tspan>
          ))}
        </text>
      );
    }
    const first = side === "above" ? -(r + 10 + (lines.length - 1) * LINE) : r + 20;
    return (
      <text y={first} textAnchor="middle" className={className}>
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : LINE}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <div>
      <div ref={wrapRef} className="w-full">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label={labels.label}
            className="block overflow-visible"
          >
            {EDGES.map((_, i) => (
              <line
                key={i}
                ref={(element) => {
                  edges.current[i] = element;
                }}
                className="stroke-foreground/35"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            ))}

            {NODES.map((key) => {
              const place = {
                ref: (element: SVGGElement | null) => {
                  groups.current[key] = element;
                },
                transform: `translate(${home(key).x} ${home(key).y})`,
              };
              if (!isTopic(key)) {
                return (
                  <g key={key} {...place}>
                    <circle r={FIELD_RADIUS} className="fill-control-border" />
                    {label(key)}
                  </g>
                );
              }
              const topic = TOPICS[key];
              return (
                <a
                  key={key}
                  href={topic.href}
                  onClick={goTo(topic.href)}
                  aria-label={`${topic.index} ${labels[key]}`}
                  className="group cursor-pointer outline-none"
                >
                  <g {...place}>
                    {/* A ring for keyboard focus, drawn round the node. */}
                    <circle
                      r={TOPIC_RADIUS + 6}
                      fill="none"
                      className="stroke-ring opacity-0 group-focus-visible:opacity-100"
                      strokeWidth={2}
                    />
                    <circle
                      r={TOPIC_RADIUS}
                      className="fill-primary transition-colors duration-200 group-hover:fill-iris"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none fill-primary-foreground font-mono text-[12px]"
                    >
                      {topic.index}
                    </text>
                    {label(key)}
                  </g>
                </a>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default ResearchMap;
