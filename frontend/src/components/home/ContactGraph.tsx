import { type ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Copy, Mail, MessageSquare } from "lucide-react";

import CopiedAnnouncement from "@/components/feedback/CopiedAnnouncement";
import { useCircuit } from "@/components/home/circuitContext";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useElementSize } from "@/hooks/use-element-size";
import { useInView, useOnceInView } from "@/hooks/use-in-view";
import { useLatest } from "@/hooks/use-latest";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { EASE_BRAND } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The ways to reach me as a graph: me at the hub, as my avatar, and an edge out to each
 * way, the nodes being the controls themselves. The e-mail node's address
 * opens the mail app and its "copy" copies it; the Vex node opens the chat;
 * the GitHub node opens the profile. Pointing at or focusing a node lights
 * its edge in iris and sends a pulse along it from the hub to the node. The
 * first time the graph is in view the hub appears; then each edge is drawn
 * out in turn and its node appears as the edge lands. Where the page's
 * circuit runs (from xl up), the graph runs on its power: it lights up each
 * time the current reaches the hub and closes the circuit, and switches off
 * again, the nodes first (the last first) and then the edges drawn back into
 * the hub, when the reader scrolls back up and it opens. Keyboard focus on a
 * node powers the graph at once. Elsewhere it appears with the hub, once.
 * While powered the edges wave gently, each on its own
 * rhythm, and each carries its own current, a spark running out along it on
 * an irregular beat, the edge shivering as it passes, for as long as the
 * graph is on screen and the page is visible: a
 * named exception in the kit. Under reduced motion it is all simply there,
 * still.
 *
 * From lg up it is a star across the content width; below, where a star has
 * no room, it is a tree: the hub on top and a line down past the nodes.
 */

export type ContactGraphLabels = {
  email: string;
  /** How soon I reply, under the address. */
  reply: string;
  copy: string;
  copied: string;
  vex: string;
  vexMain: string;
  vexLine: string;
  github: string;
  githubLine: string;
};

type ContactGraphProps = {
  email: string;
  githubUrl: string;
  onAskVex: () => void;
  labels: ContactGraphLabels;
};

/** Where each node sits in the star, as a share of the graph's box. */
const STAR = [
  { x: 17, y: 34 },
  { x: 82, y: 24 },
  { x: 82, y: 78 },
] as const;
const HUB = { x: 50, y: 50 };

/** My avatar, on the kit's lavender; decorative, as the nodes say who it is. */
const AVATAR = "/avatar.webp";

/** The arrival: the hub, then each edge drawn out in turn, its node appearing as it lands. */
const HUB_MS = 400;
const EDGE_MS = 700;
const STAGGER_MS = 180;
/** The spark sent along an edge, from the hub to its node: iris over a blush echo. */
const PULSE_MS = 560;
/**
 * While the edges wave, each carries its own current: a spark goes out along
 * it every so often, at an irregular beat between these two, so the graph is
 * never dark and never in step.
 */
const SPARK_MIN_MS = 700;
const SPARK_MAX_MS = 1300;
const sparkGap = () => SPARK_MIN_MS + Math.random() * (SPARK_MAX_MS - SPARK_MIN_MS);
/** The shiver of an edge a spark runs along, like the stack's jolt. */
const JOLT_MS = 300;
const JOLT_PX = 3;
/** A spark's length, in pixels. */
const SPARK_PX = 28;
/**
 * When an edge starts drawing, and when its node appears. On the first
 * arrival the edges wait half the hub's own entrance; powered again later,
 * the hub is long there, so they start at once.
 */
const edgeAt = (index: number, afterHub: boolean) =>
  (afterHub ? HUB_MS / 2 : 0) + index * STAGGER_MS;
const nodeAt = (index: number, afterHub: boolean) => edgeAt(index, afterHub) + EDGE_MS * 0.65;
/** How long a node takes to appear. */
const NODE_ON_MS = 500;
/**
 * Losing power: the nodes go, the last first, each over NODE_OFF_MS, and
 * once they all have, each edge draws back into the hub over EDGE_OFF_MS.
 */
const NODE_OFF_MS = 200;
const OFF_STAGGER_MS = 60;
const EDGE_OFF_MS = 400;
const nodeOffAt = (index: number) => (STAR.length - 1 - index) * OFF_STAGGER_MS;
const nodesOffBy = nodeOffAt(0) + NODE_OFF_MS;
const edgeOffAt = (index: number) => nodesOffBy + nodeOffAt(index);

/** The waving: how far an edge's middle swings, and each edge's period. */
const WAVE_PX = 7;
const WAVE_MS = [3600, 4300, 5000] as const;

/** The official GitHub mark (Simple Icons, CC0), drawn in the current colour. */
const GITHUB_MARK =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

/** How long "copied" stays before the control reads "copy" again. */
const COPIED_MS = 2000;

const NODE =
  "group block rounded-card border bg-card px-5 py-4 text-left outline-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background";
const NODE_ON = "border-iris shadow-lift";
const KEY = "font-mono text-meta uppercase tracking-widest text-iris";
const MAIN = "mt-1 block text-lg text-foreground";
const LINE = "mt-0.5 block text-sm text-muted-foreground";

const NodeBody = ({
  label,
  icon,
  main,
  line,
}: {
  label: string;
  icon?: ReactNode;
  main: ReactNode;
  line: ReactNode;
}) => (
  <>
    <span className={cn(KEY, "flex items-center gap-2")}>
      {icon}
      {label}
    </span>
    <span className={MAIN}>{main}</span>
    <span className={LINE}>{line}</span>
  </>
);

const ContactGraph = ({ email, githubUrl, onAskVex, labels }: ContactGraphProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [hot, setHot] = useState<number | null>(null);
  const clipboard = useCopyToClipboard(COPIED_MS);
  const copied = clipboard.copied;
  const copy = () => clipboard.copy(email);

  // The hub appears the first time the graph is well in view.
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useOnceInView(box, () => setSeen(true), { threshold: 0.4 });

  // Where the page's circuit is drawn (from xl up, in motion; see Circuit),
  // the graph runs on its power: shown while the circuit is closed, off when
  // it opens. Keyboard focus on a node powers it at once, without the
  // arrival, so focus never lands on a card that cannot be seen. Elsewhere
  // the graph appears with the hub, and stays.
  const circuit = useCircuit();
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const powered = circuit.wired ? circuit.closed || keyboardFocus : seen;
  const hubShown = seen || prefersReducedMotion;
  const lit = powered || prefersReducedMotion;
  /** Powered by focus alone: at once, no arrival. */
  const instant = circuit.wired && keyboardFocus && !circuit.closed;
  /** The first arrival waits for the hub's entrance; a later powering does not. */
  const afterHub = !circuit.wired;

  // The star's box in pixels, so its edges can be drawn as curves.
  const star = useRef<HTMLDivElement>(null);
  const size = useElementSize(star);

  // Each edge as a curve from the hub to its node; `swing` bends its middle
  // sideways, in pixels.
  const curve = (index: number, swing: number) => {
    const x1 = (HUB.x / 100) * size.width;
    const y1 = (HUB.y / 100) * size.height;
    const x2 = (STAR[index].x / 100) * size.width;
    const y2 = (STAR[index].y / 100) * size.height;
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    const cx = (x1 + x2) / 2 - ((y2 - y1) / length) * swing;
    const cy = (y1 + y2) / 2 + ((x2 - x1) / length) * swing;
    return `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`;
  };
  // Each edge's length in pixels, with room for its bend, so the drawing in
  // and the sparks are measured in pixels (a path length of 1 is not scaled
  // the same way in every browser).
  const lengthOf = (index: number) =>
    Math.hypot(
      ((STAR[index].x - HUB.x) / 100) * size.width,
      ((STAR[index].y - HUB.y) / 100) * size.height,
    ) +
    2 * WAVE_PX;
  const edges = useRef<(SVGPathElement | null)[]>([]);
  // Where each edge's middle is now, so a re-render (pointing at a node)
  // draws it where it is rather than snapping it straight.
  const swings = useRef<number[]>([0, 0, 0]);

  // A spark sent along an edge, from the hub to its node: a short dash of
  // iris with a blush echo a beat behind, and the edge shivering as it goes.
  const pulses = useRef<(SVGPathElement | null)[]>([]);
  const echoes = useRef<(SVGPathElement | null)[]>([]);
  const sparkAt = useRef<number[]>([-Infinity, -Infinity, -Infinity]);
  const spark = (index: number) => {
    if (!lit || prefersReducedMotion) return;
    sparkAt.current[index] = performance.now();
    const run = [{ strokeDashoffset: SPARK_PX }, { strokeDashoffset: -lengthOf(index) }];
    // Linear, as current runs: an eased spark would spend its time hidden
    // under the node it reaches.
    pulses.current[index]?.animate(run, { duration: PULSE_MS, easing: "linear" });
    echoes.current[index]?.animate(run, { duration: PULSE_MS, delay: 40, easing: "linear" });
  };
  const latestSpark = useLatest(spark);

  // The waving runs only while the graph is on screen and the page is
  // visible; the paths are moved directly, frame by frame,
  // without re-rendering.
  const onScreen = useInView(box);
  const waving = powered && onScreen && !prefersReducedMotion && size.width > 0;
  // When the wave began, kept across power cuts, so powering up again
  // carries the edges on from where they stopped rather than jumping.
  const waveStart = useRef<number | null>(null);
  // Read through refs, so a resize redraws the curves without restarting
  // the wave or the beats.
  const latestCurve = useLatest(curve);
  useEffect(() => {
    if (!waving) return;
    let frame = 0;
    const start = (waveStart.current ??= performance.now());
    const sparks = [...pulses.current, ...echoes.current];
    const step = (now: number) => {
      if (!document.hidden) {
        STAR.forEach((_, index) => {
          const since = now - sparkAt.current[index];
          const jolt = since < JOLT_MS ? JOLT_PX * Math.sin(now / 16) * (1 - since / JOLT_MS) : 0;
          const swing =
            WAVE_PX * Math.sin(((now - start) / WAVE_MS[index]) * 2 * Math.PI + index * 1.7) + jolt;
          swings.current[index] = swing;
          const d = latestCurve.current(index, swing);
          edges.current[index]?.setAttribute("d", d);
          pulses.current[index]?.setAttribute("d", d);
          echoes.current[index]?.setAttribute("d", d);
        });
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    // The current: every edge sparks on its own irregular beat, the first
    // ones staggered so they do not all leave the hub together.
    const timers = STAR.map(() => 0);
    const beat = (index: number, wait: number) => {
      timers[index] = window.setTimeout(() => {
        if (!document.hidden) latestSpark.current(index);
        beat(index, sparkGap());
      }, wait);
    };
    STAR.forEach((_, index) => beat(index, index * (SPARK_MIN_MS / 2)));
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      // A spark under way goes with the power, rather than outrun its edge
      // as the edge draws back.
      for (const path of sparks) {
        path?.getAnimations().forEach((animation) => animation.cancel());
      }
    };
  }, [waving, latestCurve, latestSpark]);

  const pulse = spark;

  // Each node with what lights its edge, the same in the star and the tree.
  const point = (index: number) => ({
    onPointerEnter: () => {
      setHot(index);
      pulse(index);
    },
    onPointerLeave: () => setHot(null),
    onFocus: () => {
      setHot(index);
      pulse(index);
    },
    onBlur: () => setHot(null),
  });

  const nodes = [
    // The address is the link, stretched over the whole card; the copy
    // control sits on top of it, beside the address, as the arrows do in the
    // other nodes.
    <div
      key="email"
      {...point(0)}
      className={cn(
        NODE,
        // The address link covers the card, so the card shows its focus.
        "relative has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-[3px] has-[a:focus-visible]:ring-offset-background",
        hot === 0 ? NODE_ON : "border-border",
      )}
    >
      <span className={cn(KEY, "flex items-center gap-2")}>
        <Mail aria-hidden="true" className="size-4" />
        {labels.email}
      </span>
      <span className={cn(MAIN, "flex items-center gap-2")}>
        <a
          href={`mailto:${email}`}
          className="min-w-0 break-words font-mono text-base outline-none after:absolute after:inset-0 after:rounded-card max-sm:text-sm"
        >
          {/* Where it must break, it breaks at the @, never inside the domain. */}
          {email.split("@")[0]}
          <wbr />@{email.split("@")[1]}
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label={labels.copy}
          className="relative z-10 -m-2.5 grid size-9 shrink-0 place-items-center rounded-lg text-iris outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
        </button>
        <CopiedAnnouncement copied={copied} message={labels.copied} />
      </span>
      <span className={LINE}>{labels.reply}</span>
    </div>,
    <button
      key="vex"
      type="button"
      onClick={onAskVex}
      {...point(1)}
      className={cn(NODE, "w-full", hot === 1 ? NODE_ON : "border-border")}
    >
      <NodeBody
        label={labels.vex}
        icon={<MessageSquare aria-hidden="true" className="size-4" />}
        main={
          <span className="inline-flex items-center gap-2">
            {labels.vexMain}
            <ArrowRight aria-hidden="true" className="size-4 text-iris" />
          </span>
        }
        line={labels.vexLine}
      />
    </button>,
    <a
      key="github"
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      {...point(2)}
      className={cn(NODE, hot === 2 ? NODE_ON : "border-border")}
    >
      <NodeBody
        label={labels.github}
        icon={
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
            <path d={GITHUB_MARK} />
          </svg>
        }
        main={
          <span className="inline-flex items-center gap-2">
            {githubUrl.replace(/^https?:\/\//, "")}
            <ArrowUpRight aria-hidden="true" className="size-4 text-iris" />
          </span>
        }
        line={labels.githubLine}
      />
    </a>,
  ];

  const edge = (index: number) => (hot === index ? "stroke-iris" : "stroke-control-border");
  // Powered, each node fades and rises in as its edge lands (at once when
  // focus powered it). When the power goes, the reverse and quicker: the
  // nodes go first, the last first, then the edges draw back (see edgeDelay).
  const arrive = (index: number) => ({
    className: cn(
      "transition-[opacity,translate] ease-brand",
      lit ? "opacity-100 [translate:0_0]" : "pointer-events-none opacity-0 [translate:0_8px]",
    ),
    style: {
      transitionDuration: `${lit ? NODE_ON_MS : NODE_OFF_MS}ms`,
      transitionDelay: `${lit ? (instant ? 0 : nodeAt(index, afterHub)) : nodeOffAt(index)}ms`,
    },
  });
  const edgeDelay = (index: number) =>
    lit ? (instant ? 0 : edgeAt(index, afterHub)) : edgeOffAt(index);

  return (
    <div
      ref={box}
      // Keyboard focus only: a click also focuses what it presses, and must
      // not keep the graph powered after the reader has scrolled away.
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setKeyboardFocus(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false);
      }}
    >
      {/* The star, from lg up. */}
      <div ref={star} className="relative hidden h-[25rem] lg:block">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
          {size.width > 0 &&
            STAR.map((_, index) => (
              <path
                key={index}
                ref={(path) => {
                  edges.current[index] = path;
                }}
                d={curve(index, swings.current[index])}
                fill="none"
                strokeDasharray={lengthOf(index)}
                strokeDashoffset={lit ? 0 : lengthOf(index)}
                strokeWidth={hot === index ? 2 : 1.5}
                className={edge(index)}
                style={{
                  transition: `stroke-dashoffset ${lit ? EDGE_MS : EDGE_OFF_MS}ms ${EASE_BRAND} ${edgeDelay(index)}ms, stroke 200ms, stroke-width 200ms`,
                }}
              />
            ))}
          {size.width > 0 &&
            STAR.map((_, index) => (
              <path
                key={`echo-${index}`}
                ref={(path) => {
                  echoes.current[index] = path;
                }}
                d={curve(index, swings.current[index])}
                transform="translate(1.5 1.5)"
                fill="none"
                strokeDasharray={`${SPARK_PX} ${lengthOf(index) * 2}`}
                strokeDashoffset={SPARK_PX}
                strokeWidth={3}
                strokeLinecap="round"
                className="stroke-blush-deep"
              />
            ))}
          {size.width > 0 &&
            STAR.map((_, index) => (
              <path
                key={`pulse-${index}`}
                ref={(path) => {
                  pulses.current[index] = path;
                }}
                d={curve(index, swings.current[index])}
                fill="none"
                strokeDasharray={`${SPARK_PX} ${lengthOf(index) * 2}`}
                strokeDashoffset={SPARK_PX}
                strokeWidth={3}
                strokeLinecap="round"
                className="stroke-iris"
              />
            ))}
        </svg>
        <span
          aria-hidden="true"
          // Where the home page's circuit ends; its ring brightens when the
          // circuit closes (see Circuit).
          data-circuit-end
          className={cn(
            "absolute grid size-36 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full bg-lavender shadow-[0_0_0_10px_hsl(var(--iris)/0.12)] transition-[opacity,scale,box-shadow] ease-brand",
            // Bright while the graph is powered by the circuit or by focus.
            (circuit.closed || instant) && "shadow-[0_0_0_10px_hsl(var(--iris)/0.28)]",
            hubShown ? "opacity-100 [scale:1]" : "opacity-0 [scale:0.85]",
          )}
          style={{ left: `${HUB.x}%`, top: `${HUB.y}%`, transitionDuration: `${HUB_MS}ms` }}
        >
          <img src={AVATAR} alt="" width={144} height={144} className="size-full" />
        </span>
        {nodes.map((node, index) => (
          <div
            key={index}
            className="absolute w-[19rem] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${STAR[index].x}%`, top: `${STAR[index].y}%` }}
          >
            <div {...arrive(index)}>{node}</div>
          </div>
        ))}
      </div>

      {/* The tree, below lg: the hub on top, a line down past the nodes. */}
      <div className="lg:hidden">
        <span
          aria-hidden="true"
          className="grid size-16 place-items-center overflow-hidden rounded-full bg-lavender shadow-[0_0_0_6px_hsl(var(--iris)/0.12)]"
        >
          <img src={AVATAR} alt="" width={64} height={64} className="size-full" />
        </span>
        <ol className="ml-8">
          {nodes.map((node, index) => (
            <li key={index} className="relative pl-6 pt-5">
              {/* The trunk, down to this node; the last stops at its branch. */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-px bg-control-border [li:last-child>&]:h-[3.25rem]"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-[3.25rem] h-px w-6 transition-colors duration-200",
                  hot === index ? "bg-iris" : "bg-control-border",
                )}
              />
              <div {...arrive(index)}>{node}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default ContactGraph;
