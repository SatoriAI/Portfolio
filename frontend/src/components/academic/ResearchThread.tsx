import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ArrowUpRight, Award } from "lucide-react";

import DomainGlyph, { type DomainKind } from "@/components/academic/DomainGlyph";
import { Button } from "@/components/ui/button";
import { useOnceInView, useOnScreenAtMount } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { linkedSlug, replaceHash } from "@/lib/hash";
import { matchesMedia, MEDIA } from "@/lib/media";
import type { UiSchool } from "@/lib/schoolsService";
import { splitSentences } from "@/lib/sentences";
import { cn } from "@/lib/utils";

/**
 * Three degrees in one subject at one university, told as what they are: a
 * single line of research, each step set on a harder space than the last.
 *
 * The degrees are stops on a road that runs down the page: the bachelor's
 * top left, each degree lower and further on, a curve between them. Each
 * stop stands under the drawing of its degree's space — the torus and the
 * interval, the cone, the solid of revolution — with its name, years and
 * space beside it, so the whole line can be seen at once. The road is iris
 * as far as the chosen degree and dotted beyond. Pressing a stop (or moving
 * along them with the arrow keys) brings that degree forward: its drawing
 * redraws itself and heat spreads over it, and its text rises in beside the
 * road. All three texts share one cell, so the column keeps the height of
 * the tallest and choosing never moves the page. Below lg the road runs
 * down the side and a degree's text opens under its own stop. With reduced
 * motion the drawing and the text are swapped rather than drawn and faded.
 *
 * The first time the road is well in view it arrives: it is walked from the
 * bachelor's down, each stop drawn as the road reaches it, the card last (see
 * STEP_MS). Once, never under reduced motion.
 *
 * The chosen degree is in the address as the year it began (#2019), the
 * same in both languages, so a link can open the master's; it is replaced
 * rather than pushed, so Back leaves the page, as on Experience.
 *
 * In each degree the topic is the heading, because the subject is the same
 * three times over and the topic is what changes. The research paragraph
 * shows its first two sentences with the rest a press away when it is long.
 * Each degree is one card: an award as a lavender ribbon across its top, the
 * advisor and the research areas in a footer under a hairline.
 */

export type ResearchThreadLabels = {
  advisor: string;
  researchAreas: string;
  more: string;
  less: string;
  /** Names the row of steps that choose a degree. */
  steps: string;
  /** Says the drawing can be pressed to set heat on it. */
  heatHint: string;
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
  /** What each space is called, set under the pinned drawing. */
  domainNames: Record<DomainKind, string>;
  className?: string;
};

/**
 * A degree's text longer than this opens on its first two sentences behind
 * "More"; a shorter one is read at a glance and shown whole.
 */
const COLLAPSE_FROM = 400;

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
  const [open, setOpen] = useState(false);
  const [summary, rest] =
    school.research.length > COLLAPSE_FROM
      ? splitSentences(school.research, 2)
      : [school.research.trim(), ""];

  return (
    // The degree as one card: its award as a ribbon across the top, the
    // story in the middle, who and what it was about in a footer.
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
      <div className="p-6 md:p-7">
        <h3 className="text-card-title-sm font-semibold md:text-card-title">
          {headline ?? (school.degree || school.study)}
        </h3>
        <p className="mt-1 text-base text-muted-foreground">
          {school.study} · {school.university}
        </p>
        {summary && (
          <p className="mt-5 text-pretty text-base text-foreground/90 md:text-body-lg">
            {summary}
            {open && rest && ` ${rest}`}
          </p>
        )}
        {rest && (
          <Button
            variant="link"
            className="mt-1 h-auto px-0 text-sm font-medium"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? labels.less : labels.more}
          </Button>
        )}
      </div>
      {(school.advisor || school.areas.length > 0) && (
        <dl className="grid gap-4 border-t border-border px-6 py-5 sm:grid-cols-[1fr_2fr] md:px-7">
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
    </article>
  );
};

/** A degree's name in the address: the year it began. */
const slugOf = (school: UiSchool) => school.startDate.slice(0, 4);

/**
 * Where each stop's dot sits in the road's column from lg: across as a share
 * of the column (closer together until xl, so the last name clears the card),
 * down in pixels. Three degrees, three places; a fourth would
 * need one more.
 */
const STOPS = [
  { x: "12%", xl: "14%", y: 136 },
  { x: "29%", xl: "36%", y: 340 },
  { x: "46%", xl: "58%", y: 544 },
] as const;
/** The road's column: tall enough for the last stop's name under its dot. */
const ROAD_HEIGHT = 620;

// Literal classes, so Tailwind finds them: below lg each stop and its text
// take turns in one column.
const STOP_ORDER = ["order-1", "order-3", "order-5"];
const TEXT_ORDER = ["order-2", "order-4", "order-6"];

type Point = { x: number; y: number };

/**
 * The road's arrival, once, the first time it is well in view: it is walked
 * from the bachelor's down to the doctorate at a steady pace, each stop's
 * drawing drawing itself and its name rising in as the road reaches it. The
 * chosen degree's card rises in at the start, so there is something to read
 * while the road is walked beside it. `STEP_MS` apart, linear, as a walk is;
 * the risings are the kit's section entrance (8px, 400ms).
 */
const STEP_MS = 450;
const RISE_MS = 400;
type Arrival = "waiting" | "walking" | "done";

/** A drawing that keeps the delay it was mounted with, so a later render
 *  cannot move its first heat. */
const ArrivingGlyph = ({
  delayMs,
  ...props
}: { delayMs: number } & Omit<Parameters<typeof DomainGlyph>[0], "delayMs">) => {
  const [delay] = useState(delayMs);
  return <DomainGlyph {...props} delayMs={delay} />;
};

/** The road from one dot to the next: down out of the first, in from the side. */
const segment = (from: Point, to: Point, radius: number) =>
  `M ${from.x} ${from.y + radius} C ${from.x} ${from.y + 150}, ${to.x - 150} ${to.y}, ${to.x - radius} ${to.y}`;

const ResearchThread = ({
  schools,
  labels,
  highlights = {},
  headlines = {},
  domains = {},
  domainNames,
  className,
}: ResearchThreadProps) => {
  const [first] = schools;
  const [selected, setSelected] = useState(() => {
    const linked = schools.find((school) => slugOf(school) === linkedSlug());
    return String((linked ?? first)?.id ?? "");
  });

  // The road is drawn between the dots where they actually are, measured
  // from the column, so it meets each dot at any width.
  const road = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  useLayoutEffect(() => {
    const column = road.current;
    if (!column) return;
    const measure = () => {
      const box = column.getBoundingClientRect();
      setPoints(
        dots.current.flatMap((dot) => {
          if (!dot) return [];
          const at = dot.getBoundingClientRect();
          return [{ x: at.left + at.width / 2 - box.left, y: at.top + at.height / 2 - box.top }];
        }),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, [schools.length]);

  // Whether the reader has chosen a degree yet.
  const [chosen, setChosen] = useState(false);
  const stops = useRef<(HTMLButtonElement | null)[]>([]);
  const choose = (id: string) => {
    setSelected(id);
    setChosen(true);
    const index = schools.findIndex((candidate) => String(candidate.id) === id);
    const school = schools[index];
    if (!school) return;
    // Below lg the open card sits under its stop, so choosing a later one
    // closes a long card above it; bring the chosen stop back to the top.
    if (!matchesMedia(MEDIA.lg)) {
      window.requestAnimationFrame(() =>
        stops.current[index]?.scrollIntoView({
          block: "start",
          behavior: prefersReducedMotion ? "auto" : "smooth",
        }),
      );
    }
    replaceHash(slugOf(school));
  };
  // Nothing waits under reduced motion: the road is simply there.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [arrival, setArrival] = useState<Arrival>(prefersReducedMotion ? "done" : "waiting");
  // In state, not a ref: the thread can render nothing at first (see below)
  // and mount its road later, and the hooks must see it when it does.
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const last = schools.length - 1;
  useOnceInView(root, () => setArrival("walking"), {
    threshold: 0.3,
    enabled: arrival === "waiting",
  });
  // Already on screen when it mounts (a link to #cone, say): simply there.
  const onScreenAtMount = useOnScreenAtMount(root);
  if (onScreenAtMount && arrival === "waiting") setArrival("done");
  useEffect(() => {
    if (arrival !== "walking") return;
    const timer = window.setTimeout(() => setArrival("done"), last * STEP_MS + RISE_MS + 200);
    return () => window.clearTimeout(timer);
  }, [arrival, last]);
  /** Classes and delay for something that rises in during the arrival. */
  const rising = (delayMs: number) =>
    arrival === "waiting"
      ? { className: "opacity-0 translate-y-2" }
      : arrival === "walking"
        ? {
            className: "transition-[opacity,transform] duration-400 ease-brand",
            delay: `${delayMs}ms`,
          }
        : { className: "" };
  // The road is uncovered from the first dot down to the last, linearly.
  const roadClip =
    arrival === "done" || points.length < 2
      ? undefined
      : {
          clipPath: `inset(0 0 ${ROAD_HEIGHT - (arrival === "waiting" ? points[0].y : points[last].y + 14)}px 0)`,
          transition: arrival === "walking" ? `clip-path ${last * STEP_MS}ms linear` : undefined,
        };

  const current = schools.find((school) => String(school.id) === selected) ?? first;
  if (!current) return null;
  const at = schools.indexOf(current);

  // The road runs down, so Up and Down step along it (the tabs' own keys);
  // Left and Right do too, as it also runs across.
  const onRoadKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const from = stops.current.findIndex((stop) => stop === document.activeElement);
    stops.current[(from === -1 ? at : from) + step]?.focus();
  };

  return (
    <TabsPrimitive.Root
      ref={setRoot}
      orientation="vertical"
      value={String(current.id)}
      onValueChange={choose}
      className={cn("relative flex flex-col lg:grid lg:grid-cols-12 lg:gap-x-6", className)}
    >
      {/* Below lg the road is a line down the side, the dots on it. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-12 left-[13px] top-3 w-0.5 origin-top bg-border lg:hidden",
          arrival === "waiting" && "scale-y-0",
        )}
        style={
          arrival === "walking" ? { transition: `transform ${last * STEP_MS}ms linear` } : undefined
        }
      />

      {/* From lg the road's column; below, its stops join the one column. */}
      <div
        ref={road}
        className="contents lg:relative lg:col-span-6 lg:block"
        style={
          {
            height: ROAD_HEIGHT,
            "--hint-y": `${STOPS[0].y - 124 - 32}px`,
          } as CSSProperties
        }
      >
        {/* Only where the heat plays: just above the drawings it is about,
            in line with the heading from lg, over the stops below. */}
        <p
          className={cn(
            "order-first mb-6 pl-11 font-mono text-meta text-muted-foreground motion-reduce:hidden",
            "lg:absolute lg:left-0 lg:top-[var(--hint-y)] lg:mb-0 lg:pl-0",
            rising(0).className,
          )}
          style={{ transitionDelay: rising(RISE_MS).delay }}
        >
          {labels.heatHint}
        </p>
        {points.length === schools.length && (
          <svg
            aria-hidden="true"
            className="absolute inset-0 hidden h-full w-full overflow-visible lg:block"
            style={roadClip}
          >
            {points.slice(1).map((to, index) => {
              const reached = index < at;
              return (
                <path
                  key={index}
                  d={segment(points[index], to, 14)}
                  fill="none"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={reached ? undefined : "2 9"}
                  className={cn(
                    "transition-[stroke] duration-200",
                    reached ? "stroke-iris" : "stroke-border",
                  )}
                />
              );
            })}
          </svg>
        )}
        <TabsPrimitive.List
          aria-label={labels.steps}
          onKeyDown={onRoadKey}
          className="contents lg:absolute lg:inset-0 lg:block"
        >
          {schools.map((school, index) => {
            const isCurrent = index === at;
            const domain = domains[school.startDate];
            const place = STOPS[index] ?? STOPS[STOPS.length - 1];
            const arrive = rising(index * STEP_MS);
            return (
              <TabsPrimitive.Trigger
                key={school.id}
                ref={(element) => {
                  stops.current[index] = element;
                }}
                value={String(school.id)}
                style={
                  {
                    "--x": place.x,
                    "--x-xl": place.xl,
                    "--y": `${place.y}px`,
                    transitionDelay: arrive.delay,
                  } as CSSProperties
                }
                className={cn(
                  "group relative mb-6 flex scroll-mt-24 items-center gap-4 rounded-lg pl-11 text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
                  arrive.className,
                  // From lg a stop is its drawing over its dot, the name beside
                  // the dot, all one box, so the focus ring takes in all three.
                  "lg:absolute lg:left-[calc(var(--x)-60px)] lg:top-[calc(var(--y)-124px)] lg:mb-0 lg:grid lg:w-max lg:grid-cols-[120px_auto] lg:items-start lg:p-0 xl:left-[calc(var(--x-xl)-60px)]",
                  STOP_ORDER[index],
                  "lg:order-none",
                )}
              >
                {domain && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "order-2 ml-auto block h-14 w-14 shrink-0 transition-opacity duration-200 lg:order-none lg:col-start-1 lg:row-start-1 lg:ml-0 lg:h-[100px] lg:w-full",
                      isCurrent ? "opacity-100" : "opacity-50 group-hover:opacity-80",
                    )}
                  >
                    {/* Mounted when the road arrives, each as it is reached.
                        Choosing a degree remounts its drawing, so it draws
                        itself again and the heat starts on it. */}
                    {arrival !== "waiting" && (
                      <ArrivingGlyph
                        key={`${domain}-${isCurrent}`}
                        kind={domain}
                        entrance="mount"
                        delayMs={arrival === "walking" ? index * STEP_MS : 0}
                        heat={isCurrent}
                        className="h-full w-full"
                      />
                    )}
                  </span>
                )}
                <span
                  ref={(element) => {
                    dots.current[index] = element;
                  }}
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-0.5 block size-7 rounded-full transition-[background-color,border-color,box-shadow] duration-200",
                    "lg:static lg:col-start-1 lg:row-start-2 lg:mx-auto lg:mt-3",
                    isCurrent
                      ? "bg-iris shadow-[0_0_0_6px_hsl(var(--lavender))]"
                      : cn(
                          "border-[3px] bg-card group-hover:border-iris",
                          index < at ? "border-iris" : "border-border",
                        ),
                  )}
                />
                <span className="block min-w-0 lg:col-start-2 lg:row-start-2 lg:-ml-[34px] lg:mt-1 lg:pb-1 lg:pr-1">
                  <span
                    className={cn(
                      "block text-card-title-sm font-semibold transition-colors duration-200",
                      isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {school.degree}
                  </span>
                  <span className="block font-mono text-meta text-iris">{school.period}</span>
                  {domain && (
                    <span className="block font-mono text-meta text-muted-foreground">
                      {domainNames[domain]}
                    </span>
                  )}
                </span>
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      </div>

      {/* The texts: from lg all three in one cell beside the road, the
          chosen one rising in as a section does (8px, 400ms) and the others
          kept, invisible, for their height; below, each under its stop. */}
      <div className="contents lg:col-span-6 lg:grid lg:self-center">
        {schools.map((school, index) => {
          const arrive = rising(0);
          return (
            <TabsPrimitive.Content
              key={school.id}
              value={String(school.id)}
              forceMount
              style={
                arrive.delay
                  ? ({
                      "--arrive": `${index * STEP_MS + 200}ms`,
                      "--arrive-lg": "200ms",
                    } as CSSProperties)
                  : undefined
              }
              className={cn(
                arrive.className,
                arrive.delay &&
                  "[transition-delay:var(--arrive)] lg:[transition-delay:var(--arrive-lg)]",
                // On a phone the card takes the full width under its stop, over
                // the road's line, so its text is not squeezed beside it.
                "group/panel relative pb-8 pl-11 focus-visible:outline-none max-sm:pl-0 lg:p-0 lg:[grid-area:1/1]",
                "data-[state=inactive]:max-lg:hidden data-[state=inactive]:lg:invisible",
                // A degree the reader chooses brings its card in with the
                // section entrance; the first card arrives with the road.
                chosen &&
                  "data-[state=active]:duration-400 data-[state=active]:ease-brand data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 motion-reduce:data-[state=active]:animate-none",
                TEXT_ORDER[index],
                "lg:order-none",
              )}
            >
              <DegreeText
                school={school}
                labels={labels}
                highlight={highlights[school.startDate]}
                headline={headlines[school.startDate]}
              />
            </TabsPrimitive.Content>
          );
        })}
      </div>
    </TabsPrimitive.Root>
  );
};

export default ResearchThread;
