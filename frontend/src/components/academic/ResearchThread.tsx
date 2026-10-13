import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ArrowUpRight, Award, Undo2 } from "lucide-react";

import DomainGlyph, { type DomainKind, GLYPH_SCALE } from "@/components/academic/DomainGlyph";
import { Button } from "@/components/ui/button";
import { useElementSize } from "@/hooks/use-element-size";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/use-media-query";
import {
  type RoadFrame,
  roadFrame,
  type RoadGeometry,
  roadGeometry,
  spiralPath,
  unwindMs,
  windMs,
} from "@/lib/degreeRoad";
import { linkedSlug, replaceHash } from "@/lib/hash";
import { MEDIA } from "@/lib/media";
import { clamp01, EASE_BRAND } from "@/lib/motion";
import type { UiSchool } from "@/lib/schoolsService";
import { cn } from "@/lib/utils";

/**
 * Three degrees in one subject at one university, told as what they are: a
 * single line of research, each step set on a harder space than the last.
 *
 * At rest the degrees are stops on a road across the column, the bachelor's
 * on the left: a soft dotted wave through three white discs, each holding the
 * drawing of its degree's space (the torus and the interval, the cone, the
 * solid of revolution) with its name, years and space under it, the road
 * trailing off to the right. Nothing is chosen and no card shows.
 *
 * A stop shows it can be pressed under the pointer or keyboard focus: its
 * name turns iris and its disc lifts, as the company circles on Experience
 * do. Choosing one rings it at once, in the lavender ring every chosen
 * circle on the site wears, and winds the road up: it is reeled in from its
 * far end onto a lavender coil round the first stop, the other stops riding
 * the thread in, the chosen one on top; the coil travels up to the top of
 * the section and unrolls into a row of three small discs, the chosen one's
 * name beside the row, and the degree's card rises in under it, the full
 * width of the column (windMs(), the kit's ease; the geometry and every
 * frame are in lib/degreeRoad). In the row, another disc takes the ring and
 * swaps the card; "Show whole road" or Escape winds it all back out, and
 * brings the row back into view first when the reader has scrolled down the
 * card. Either way can be turned round half-way. Below md the stops are a
 * list, and they simply cross over to the row (280 ms), the name on a line
 * under it. With reduced motion the two states swap with a 150 ms fade.
 *
 * The motion is the Web Animations API on transforms, opacity, stroke and
 * clipping, sampled from the frames; each run's end state is also set as
 * plain styles first, so a timeline frozen in a background tab can never
 * leave a part half-way.
 *
 * The chosen degree is in the address as the year it began (#2019), the
 * same in both languages, so a link opens the master's straight in the row,
 * with no winding; it is replaced rather than pushed, so Back leaves the
 * page, as on Experience. The stops are tabs: Tab reaches them, the arrows
 * move between them (and in the row choose as they move), Enter or Space
 * chooses.
 *
 * In each degree the topic is the heading, because the subject is the same
 * three times over and the topic is what changes. Each degree is one card:
 * an award as a lavender ribbon across its top, then the story; the advisor
 * and the research areas beside it from lg (eight columns to four, so the
 * story keeps a readable measure), in a footer under a hairline below.
 */

export type ResearchThreadLabels = {
  advisor: string;
  researchAreas: string;
  /** Names the row of steps that choose a degree. */
  steps: string;
  /** Over the road: a stop can be chosen. */
  hint: string;
  /** Winds the row back out into the road; also the control's name on a phone, where it is an icon. */
  wholeRoad: string;
  /** Read after a link that opens in a new tab. */
  newTab: string;
};

type ResearchThreadProps = {
  /** In chronological order, earliest first. */
  schools: readonly UiSchool[];
  labels: ResearchThreadLabels;
  /** An award the degree's work won, keyed by the degree's start date. */
  highlights?: Record<string, DegreeHighlight>;
  /** The degree's topic, keyed by its start date; the degree names it where there is none. */
  headlines?: Record<string, string>;
  /** The space the degree's work was set on, keyed by its start date. */
  domains?: Record<string, DomainKind>;
  /** What each space is called, set under its stop. */
  domainNames: Record<DomainKind, string>;
  className?: string;
};

export type DegreeHighlight = {
  /** Small capitals over the award, e.g. who gave it. */
  label: string;
  text: string;
  /** The award's own page; the whole card then opens it, in a new tab. */
  href?: string;
};

type DegreeTextProps = {
  school: UiSchool;
  labels: ResearchThreadLabels;
  highlight?: DegreeHighlight;
  headline?: string;
};

const DegreeText = ({ school, labels, highlight, headline }: DegreeTextProps) => {
  return (
    // The degree as one card: its award as a ribbon across the top, the
    // story under it, who and what it was about beside it from lg (eight
    // columns to four) and in a footer below that.
    <article className="min-w-0 overflow-hidden rounded-card border border-border bg-card group-focus-visible/panel:ring-2 group-focus-visible/panel:ring-ring group-focus-visible/panel:ring-offset-2 group-focus-visible/panel:ring-offset-background">
      {/* With a page of its own, the award's words are a link stretched over
          the ribbon, so the whole ribbon opens it; focus rings the words. */}
      {highlight && (
        <div className="relative flex items-center gap-3 bg-lavender px-6 py-3 md:px-7">
          <Award aria-hidden="true" className="size-5 shrink-0 text-iris" />
          <p className="text-sm text-foreground">
            <span className="font-mono text-meta uppercase tracking-widest text-iris">
              {highlight.label}
            </span>
            <span aria-hidden="true"> · </span>
            {highlight.href ? (
              <a
                href={highlight.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm underline-offset-4 outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-lavender"
              >
                {highlight.text}
                <ArrowUpRight
                  aria-hidden="true"
                  className="ml-1 inline size-3.5 -translate-y-px align-middle text-iris"
                />
                <span className="sr-only"> {labels.newTab}</span>
              </a>
            ) : (
              highlight.text
            )}
          </p>
        </div>
      )}
      <div className="lg:grid lg:grid-cols-12">
        <div
          className={cn(
            "p-6 md:p-7",
            school.advisor || school.areas.length > 0 ? "lg:col-span-8" : "lg:col-span-12",
          )}
        >
          <h3 className="text-card-title-sm font-semibold md:text-card-title">
            {headline ?? (school.degree || school.study)}
          </h3>
          <p className="mt-1 text-base text-muted-foreground">
            {school.study} · {school.university}
          </p>
          {/* The whole story, never cut short. */}
          {school.research.trim() && (
            <p className="mt-5 text-pretty text-base text-foreground/90 md:text-body-lg">
              {school.research.trim()}
            </p>
          )}
        </div>
        {(school.advisor || school.areas.length > 0) && (
          <dl className="grid gap-4 border-t border-border px-6 py-5 sm:grid-cols-[1fr_2fr] md:px-7 lg:col-span-4 lg:grid-cols-1 lg:content-start lg:gap-6 lg:border-l lg:border-t-0 lg:py-7">
            {school.advisor && (
              <div>
                <dt className="font-mono text-meta uppercase tracking-widest text-muted-foreground">
                  {labels.advisor}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{school.advisor}</dd>
              </div>
            )}
            {school.areas.length > 0 && (
              <div>
                <dt className="font-mono text-meta uppercase tracking-widest text-muted-foreground">
                  {labels.researchAreas}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{school.areas.join(", ")}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </article>
  );
};

/** A degree's name in the address: the year it began. */
const slugOf = (school: UiSchool) => school.startDate.slice(0, 4);

/**
 * Where the section stands: the road out, winding into the row, the row with
 * a card, or unwinding back out.
 */
type Phase = "road" | "winding" | "compact" | "unwinding";

/** How far the page is brought back when a stop is chosen below its top, to keep the row in view. */
const SCROLL_MARGIN = { wide: 140, phone: 96 };
/** What the control at the row's right end takes, with a gap before it, from md. */
const BACK_ROOM = 192;
/** The card's fade as the road unwinds. */
const CARD_OUT_MS = 150;
/** A card's rise in when another degree is chosen in the row. */
const SWAP_MS = 280;
/** Reduced motion: the states, and the cards, swap with a fade. */
const FADE_MS = 150;
/** Frames sampled for the keyframes over a whole winding. */
const FRAMES = 60;

/** The road's dots: a 3px round dot every 11px, in a faint control border. */
const ROAD_STROKE = "hsl(var(--control-border) / 0.35)";
const ROW_DOTS = `radial-gradient(circle at 1.5px 1.5px, ${ROAD_STROKE} 1.5px, transparent 1.6px) 0 0 / 11px 3px repeat-x`;
const SPIRAL = spiralPath();

type Style = Record<string, string>;
type Part = [Element | null | undefined, Style];

/** Sets a part's style as plain inline styles. */
const setStyle = (element: Element, style: Style) => {
  const { style: inline } = element as HTMLElement;
  for (const [property, value] of Object.entries(style)) {
    if (property.startsWith("--")) inline.setProperty(property, value);
    else inline[property as "opacity"] = value;
  }
};

const ResearchThread = ({
  schools,
  labels,
  highlights = {},
  headlines = {},
  domains = {},
  domainNames,
  className,
}: ResearchThreadProps) => {
  // A linked degree opens straight in the row.
  const [linked] = useState(() => schools.findIndex((school) => slugOf(school) === linkedSlug()));
  const [selected, setSelected] = useState(Math.max(0, linked));
  const [phase, setPhase] = useState<Phase>(linked >= 0 ? "compact" : "road");
  const prefersReducedMotion = usePrefersReducedMotion();
  const wide = useMediaQuery(MEDIA.md);

  const stage = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(stage);
  const geometry = useMemo(
    () => (width > 0 ? roadGeometry(width, !wide, schools.length) : null),
    [width, wide, schools.length],
  );

  // The parts that move, set and animated by hand (see `parts`).
  const road = useRef<SVGSVGElement>(null);
  const roadLine = useRef<SVGPathElement>(null);
  const spool = useRef<HTMLDivElement>(null);
  const spiral = useRef<SVGPathElement>(null);
  const rowLine = useRef<HTMLDivElement>(null);
  const currentName = useRef<HTMLParagraphElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const stops = useRef<(HTMLButtonElement | null)[]>([]);
  const discs = useRef<(HTMLSpanElement | null)[]>([]);
  const names = useRef<(HTMLSpanElement | null)[]>([]);
  const years = useRef<(HTMLSpanElement | null)[]>([]);

  /** Every moving part's style in a frame. */
  const parts = useCallback((frame: RoadFrame, shape: RoadGeometry): Part[] => {
    return [
      [
        road.current,
        {
          opacity: `${frame.roadOpacity}`,
          clipPath: `inset(0 ${Math.max(0, shape.width - frame.roadCut).toFixed(2)}px 0 0)`,
        },
      ],
      [roadLine.current, { strokeDashoffset: `${(shape.length - frame.roadOut).toFixed(2)}` }],
      [
        spool.current,
        {
          opacity: `${frame.spool.opacity}`,
          transform: `translate3d(${frame.spool.x.toFixed(2)}px, ${frame.spool.y.toFixed(2)}px, 0) rotate(${frame.spool.rotate.toFixed(1)}deg) scale(${frame.spool.scale.toFixed(3)})`,
        },
      ],
      [spiral.current, { strokeDashoffset: `${(1 - frame.spool.wound).toFixed(4)}` }],
      [
        rowLine.current,
        {
          transform: `translate3d(${frame.rowLine.x.toFixed(2)}px, ${frame.rowLine.y}px, 0)`,
          clipPath: `inset(0 ${((1 - frame.rowLine.laid) * 100).toFixed(2)}% 0 0)`,
        },
      ],
      ...frame.stops.flatMap((stop, index): Part[] => [
        [
          stops.current[index],
          { transform: `translate3d(${stop.x.toFixed(2)}px, ${stop.y.toFixed(2)}px, 0)` },
        ],
        [
          discs.current[index],
          { transform: `scale(${stop.scale.toFixed(4)})`, [GLYPH_SCALE]: stop.scale.toFixed(4) },
        ],
        [names.current[index], { opacity: `${frame.names}` }],
        [years.current[index], { opacity: `${frame.years}` }],
      ]),
      [currentName.current, { opacity: `${frame.years}` }],
      [back.current, { opacity: `${frame.card}` }],
      [
        card.current,
        {
          opacity: `${frame.card}`,
          transform: `translate3d(0, ${(8 * (1 - frame.card)).toFixed(2)}px, 0)`,
        },
      ],
    ];
  }, []);

  // How far along the winding things are: settled, or read off the run in
  // flight, so a run can be turned round from wherever it has got to.
  const settled = useRef(phase === "compact" ? 1 : 0);
  const run = useRef<{ from: number; to: number; ms: number; animations: Animation[] } | null>(
    null,
  );
  const progress = () => {
    const now = run.current;
    if (!now) return settled.current;
    const time = Number(now.animations[0]?.currentTime ?? now.ms);
    return now.from + (now.to - now.from) * clamp01(now.ms ? time / now.ms : 1);
  };
  const stopRun = () => {
    run.current?.animations.forEach((animation) => animation.cancel());
    run.current = null;
  };
  useEffect(() => stopRun, []);

  // Each phase, and each change of width or chosen degree, sets every part
  // where it belongs; winding and unwinding animate there from wherever the
  // parts are now.
  const lastPhase = useRef(phase);
  useLayoutEffect(() => {
    if (!geometry) return;
    const moving = phase === "winding" || phase === "unwinding";
    const target = phase === "winding" || phase === "compact" ? 1 : 0;
    const from = progress();
    stopRun();
    settled.current = target;
    const end = parts(roadFrame(geometry, target), geometry);
    for (const [element, style] of end) if (element) setStyle(element, style);

    // Reduced motion: the whole stage swaps with a fade.
    if (lastPhase.current !== phase && prefersReducedMotion) {
      stage.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS });
    }
    lastPhase.current = phase;
    if (!moving || from === target) {
      if (moving) setPhase(target ? "compact" : "road");
      return;
    }

    const ms =
      Math.abs(target - from) * (target ? windMs(geometry.phone) : unwindMs(geometry.phone));
    const count = Math.max(2, Math.ceil(Math.abs(target - from) * FRAMES) + 1);
    const frames = Array.from({ length: count }, (_, k) =>
      parts(roadFrame(geometry, from + ((target - from) * k) / (count - 1)), geometry),
    );
    const animations = frames[0].flatMap(([element], index) =>
      element
        ? [
            element.animate(
              frames.map((frame) => frame[index][1]),
              { duration: ms, easing: "linear" },
            ),
          ]
        : [],
    );
    // Unwinding, the card has left the flow and lies over whatever follows
    // the section, so it goes quickly rather than with the road.
    if (phase === "unwinding" && card.current) {
      animations.push(
        card.current.animate([{ opacity: 0 }], { duration: CARD_OUT_MS, fill: "forwards" }),
      );
    }
    const now = { from, to: target, ms, animations };
    run.current = now;
    // `finished`, not `onfinish`: it settles even when the run is finished
    // by hand in a hidden tab. A run turned round is cancelled, and rejects.
    Promise.all(animations.map((animation) => animation.finished)).then(
      () => {
        if (run.current !== now) return;
        run.current = null;
        setPhase(target ? "compact" : "road");
      },
      () => {},
    );
  }, [phase, geometry, parts, prefersReducedMotion]);

  // In the row, another degree: the ring moves over to it (its colour
  // fades, see the disc), its name and card fade and rise in (a plain fade
  // under reduced motion).
  const shown = useRef(selected);
  useLayoutEffect(() => {
    const was = shown.current;
    shown.current = selected;
    if (was === selected || phase !== "compact" || !geometry) return;
    if (prefersReducedMotion) {
      card.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS });
      return;
    }
    currentName.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
    card.current?.animate(
      [
        { opacity: 0, transform: "translate3d(0, 8px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ],
      { duration: SWAP_MS, easing: EASE_BRAND },
    );
  }, [selected, phase, geometry, prefersReducedMotion]);

  const choose = (index: number) => {
    const school = schools[index];
    if (!school) return;
    setSelected(index);
    replaceHash(slugOf(school));
    if (phase === "compact" || phase === "winding") return;
    setPhase(prefersReducedMotion ? "compact" : "winding");
    bringStageBack();
  };

  // The row, and the road it winds back into, are at the top of the stage:
  // bring it back into view when the reader has scrolled past its top.
  const bringStageBack = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const top = box.top + window.scrollY - (wide ? SCROLL_MARGIN.wide : SCROLL_MARGIN.phone);
    if (window.scrollY > top) {
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }, [prefersReducedMotion, wide]);

  // Focus goes back to the chosen stop (scrolled to, if need be), and from
  // deep in a long card the stage is brought back too, so the reader sees
  // the road come out rather than the page closing up under them.
  const unwind = useCallback(() => {
    setPhase((now) =>
      now === "compact" || now === "winding" ? (prefersReducedMotion ? "road" : "unwinding") : now,
    );
    replaceHash(null);
    stops.current[selected]?.focus();
    bringStageBack();
  }, [prefersReducedMotion, selected, bringStageBack]);

  // Escape winds the row back out, wherever focus is.
  const open = phase === "compact" || phase === "winding";
  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) unwind();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, unwind]);

  const current = schools[selected] ?? schools[0];
  if (!current) return null;

  // The tabs' own keys follow the road's direction (Radix moves the focus);
  // the other two arrows step along it as well, so every arrow works
  // wherever the stops stand. On the road the arrows only move the focus; in
  // the row they choose as they go, as the stops are the row's whole point.
  const vertical = !wide && phase === "road";
  const onStopsKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = schools.length;
    const from = stops.current.findIndex((stop) => stop === document.activeElement);
    if (from === -1) return;
    const own = vertical ? { ArrowUp: -1, ArrowDown: 1 } : { ArrowLeft: -1, ArrowRight: 1 };
    const other = vertical ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 };
    const ends = { Home: -from, End: count - 1 - from };
    const key = event.key as keyof typeof own & keyof typeof other & keyof typeof ends;
    const step = own[key] ?? other[key] ?? ends[key];
    if (step === undefined) return;
    const next = (from + step + count) % count;
    if (other[key] !== undefined) {
      event.preventDefault();
      stops.current[next]?.focus();
    }
    if (phase === "compact" && next !== selected) choose(next);
  };

  const lastAt = geometry?.compact[geometry.compact.length - 1];
  const nameAt = (lastAt?.x ?? 0) + 52;

  return (
    <div className={className}>
      {/* Only while nothing is chosen; it keeps its line, so nothing moves. */}
      <p
        aria-hidden={open || undefined}
        className={cn(
          "mb-6 font-mono text-meta text-muted-foreground transition-opacity duration-200",
          open && "opacity-0",
        )}
      >
        {labels.hint}
      </p>
      <TabsPrimitive.Root
        value={open ? String(current.id) : ""}
        onValueChange={(value) =>
          choose(schools.findIndex((school) => String(school.id) === value))
        }
        orientation={vertical ? "vertical" : "horizontal"}
        activationMode="manual"
      >
        <div ref={stage} className="relative flow-root" style={{ minHeight: geometry?.height }}>
          {geometry && (
            <>
              <svg
                ref={road}
                aria-hidden="true"
                width={geometry.width}
                height={geometry.height}
                className="pointer-events-none absolute left-0 top-0 overflow-visible"
              >
                <path
                  ref={roadLine}
                  d={geometry.path}
                  fill="none"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="2 9"
                  style={{ stroke: ROAD_STROKE }}
                />
              </svg>
              {/* The coil the road winds onto, round the first stop. */}
              <div
                ref={spool}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0"
              >
                <svg
                  viewBox="-56 -56 112 112"
                  className="absolute -left-14 -top-14 size-28 overflow-visible"
                >
                  <path
                    ref={spiral}
                    d={SPIRAL}
                    pathLength={1}
                    strokeDasharray="1 1"
                    fill="none"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    className="stroke-lavender-deep"
                  />
                </svg>
              </div>
              {/* The row's own road, laid as the coil unrolls. */}
              <div
                ref={rowLine}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 -mt-[1.5px] h-[3px]"
                style={{
                  width: (lastAt?.x ?? 0) - geometry.compact[0].x,
                  background: ROW_DOTS,
                }}
              />
            </>
          )}

          <TabsPrimitive.List
            aria-label={labels.steps}
            onKeyDown={onStopsKey}
            className="pointer-events-none absolute inset-0"
          >
            {geometry &&
              schools.map((school, index) => {
                const domain = domains[school.startDate];
                const isCurrent = open && index === selected;
                return (
                  <TabsPrimitive.Trigger
                    key={school.id}
                    ref={(element) => {
                      stops.current[index] = element;
                    }}
                    value={String(school.id)}
                    aria-label={[school.degree, school.period, domain && domainNames[domain]]
                      .filter(Boolean)
                      .join(", ")}
                    // The chosen stop rides on top, so its drawing is the one
                    // that reads on the coil.
                    style={{ zIndex: isCurrent ? 2 + schools.length : 2 + index }}
                    className="group pointer-events-auto absolute left-0 top-0 size-0 p-0 focus-visible:outline-none"
                  >
                    {/* The disc: a hairline circle at any scale, the drawing
                        in it kept a hairline too (GLYPH_SCALE). Chosen, it
                        wears MARKED (circleStyles) with an iris rim, its
                        widths divided by the scale so they hold at any size;
                        the ring's colour fades in over 150 ms, so it shows the
                        moment the stop is pressed. Under the pointer the disc
                        lifts as the company circles do; keyboard focus rings
                        it in iris, white between, inside the lavender ring. */}
                    <span
                      ref={(element) => {
                        discs.current[index] = element;
                      }}
                      className={cn(
                        "absolute -left-[60px] -top-[60px] size-[120px] rounded-full outline [outline-offset:calc(5px/var(--glyph-scale,1))] [outline-width:calc(3px/var(--glyph-scale,1))]",
                        "transition-[outline-color] duration-150",
                        isCurrent ? "outline-lavender-deep" : "outline-transparent",
                      )}
                    >
                      <span className="absolute inset-0 grid place-items-center rounded-full transition-[transform,box-shadow] duration-200 ease-brand group-hover:shadow-lift group-focus-visible:[box-shadow:0_0_0_calc(3px/var(--glyph-scale,1))_hsl(var(--surface)),0_0_0_calc(5px/var(--glyph-scale,1))_hsl(var(--iris)),0_8px_24px_-12px_hsl(var(--ink)/0.25)] [@media(hover:hover)]:motion-safe:group-hover:-translate-y-1">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 120 120"
                          className="absolute inset-0 size-full overflow-visible"
                        >
                          <circle
                            cx={60}
                            cy={60}
                            r={59.5}
                            vectorEffect="non-scaling-stroke"
                            className={cn(
                              "fill-card transition-[stroke] duration-200",
                              isCurrent
                                ? "stroke-iris"
                                : "stroke-border group-hover:stroke-control-border group-focus-visible:stroke-control-border",
                            )}
                          />
                        </svg>
                        {domain && (
                          <DomainGlyph
                            kind={domain}
                            delayMs={index * 120}
                            className="relative h-[74px]"
                          />
                        )}
                      </span>
                    </span>
                    {/* On the road: the degree, its years and its space,
                        under the disc (beside it on a phone). */}
                    <span
                      ref={(element) => {
                        names.current[index] = element;
                      }}
                      className={cn(
                        "absolute flex flex-col whitespace-nowrap",
                        geometry.phone
                          ? "left-[50px] top-0 -translate-y-1/2 items-start text-left"
                          : "left-0 top-[72px] -translate-x-1/2 items-center text-center",
                        phase === "compact" && "invisible",
                      )}
                    >
                      <span className="text-card-title-sm font-semibold text-foreground transition-colors duration-200 group-hover:text-iris group-focus-visible:text-iris md:text-card-title">
                        {school.degree}
                      </span>
                      <span className="font-mono text-meta text-iris">{school.period}</span>
                      {domain && (
                        <span className="font-mono text-meta text-muted-foreground">
                          {domainNames[domain]}
                        </span>
                      )}
                    </span>
                    {/* In the row: the years under the small disc. */}
                    <span
                      ref={(element) => {
                        years.current[index] = element;
                      }}
                      className={cn(
                        "absolute left-0 top-[30px] -translate-x-1/2 whitespace-nowrap font-mono text-xs md:top-[38px]",
                        isCurrent ? "text-iris" : "text-muted-foreground",
                        phase === "road" && "invisible",
                      )}
                    >
                      {school.period}
                    </span>
                  </TabsPrimitive.Trigger>
                );
              })}
          </TabsPrimitive.List>

          {geometry && phase !== "road" && (
            <>
              {/* The chosen degree beside the row, where it was and when
                  under its name (the university from xl, where there is
                  room); on a phone, its name on a line of its own under the
                  row. Kept clear of the control at the right. */}
              <p
                ref={currentName}
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute flex flex-col",
                  geometry.phone ? "left-0" : "-translate-y-1/2",
                )}
                style={
                  geometry.phone
                    ? { top: geometry.compact[0].y + 56, maxWidth: geometry.width }
                    : {
                        left: nameAt,
                        top: geometry.compact[0].y,
                        maxWidth: geometry.width - nameAt - BACK_ROOM,
                      }
                }
              >
                <span className="truncate text-lg font-semibold tracking-tight md:text-xl">
                  {current.degree}
                </span>
                {!geometry.phone && (
                  <span className="truncate text-sm text-muted-foreground">
                    <span className="hidden xl:inline">{current.university} · </span>
                    {current.period}
                  </span>
                )}
              </p>
              <Button
                ref={back}
                type="button"
                variant="outline"
                onClick={unwind}
                className="absolute right-0 z-[4] px-4 max-md:w-11 max-md:px-0"
                style={{ top: geometry.compact[0].y - 22 }}
              >
                <Undo2 aria-hidden="true" />
                <span className="max-md:sr-only">{labels.wholeRoad}</span>
              </Button>
              {/* The card, under the row; it only takes the pointer once it
                  has arrived. Unwinding, it leaves the flow at once and fades
                  where it is, so the page closes up under it the moment the
                  reader asks, not a second later under their eyes. */}
              <div
                ref={card}
                className={cn(
                  "z-[3]",
                  phase === "unwinding" ? "absolute inset-x-0" : "relative",
                  phase !== "compact" && "pointer-events-none",
                )}
                style={
                  phase === "unwinding"
                    ? { top: geometry.cardTop }
                    : { marginTop: geometry.cardTop }
                }
              >
                <TabsPrimitive.Content
                  key={current.id}
                  value={String(current.id)}
                  forceMount
                  className="group/panel focus-visible:outline-none"
                >
                  <DegreeText
                    school={current}
                    labels={labels}
                    highlight={highlights[current.startDate]}
                    headline={headlines[current.startDate]}
                  />
                </TabsPrimitive.Content>
              </div>
            </>
          )}
        </div>
      </TabsPrimitive.Root>
    </div>
  );
};

export default ResearchThread;
