import { useCallback, useEffect, useRef, useState } from "react";
import { Box, ChevronRight, Sparkles } from "lucide-react";

import { groupTechnologies, techGroupOf } from "@/config/techGroups";
import { techIcon } from "@/config/techIcons";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { formatCounter } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * How a project is built, one technology at a time: a single slot shows one
 * part (its mark and its name), then an electric jolt (the text jitters
 * and splits into iris and blush, its mark flickers) and the next takes its
 * place, through the whole stack and round again; between jolts the slot
 * crackles faintly, as a line under current. A counter beside it says
 * where in the stack it is. Pointing at the slot stops it where it is, and a
 * click steps on to the next, as does the next control beside it. It runs
 * only for the open project, while
 * it is on screen and the page is visible. It is one of the site's two
 * loops, named exceptions in the kit. Under reduced motion there is no cycling: the
 * whole stack is shown as one line. Assistive technology always gets the
 * whole stack.
 */

/**
 * A technology's official mark in its own colour (see techIcons), or, where
 * there is none to use, a sparkle in iris for an AI tool and a plain box for
 * anything else, so a mark never claims AI for, say, a migration tool.
 * Decorative: the name stands beside it.
 */
const TechMark = ({
  tag,
  className,
  markRef,
}: {
  tag: string;
  className?: string;
  markRef?: React.Ref<SVGSVGElement>;
}) => {
  const icon = techIcon(tag);
  if (!icon) {
    return techGroupOf(tag) === "ai" ? (
      <Sparkles ref={markRef} aria-hidden="true" className={cn("text-iris", className)} />
    ) : (
      <Box ref={markRef} aria-hidden="true" className={cn("text-muted-foreground", className)} />
    );
  }
  return (
    <svg ref={markRef} aria-hidden="true" viewBox="0 0 24 24" fill={icon.hex} className={className}>
      <path d={icon.path} />
    </svg>
  );
};

/** The next control: a 44px target, quiet until pointed at. */
const CONTROL =
  "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-200 hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** How long each technology stays before the next jolt. */
const DWELL_MS = 1600;
/** The jolt; the next technology takes the slot at its midpoint. */
const JOLT_MS = 260;
/**
 * Between jolts the slot crackles, as a line under current: a small shiver of
 * the name and a flicker of its mark, at an irregular beat between these two.
 */
const CRACKLE_MS = 120;
const CRACKLE_MIN_MS = 500;
const CRACKLE_MAX_MS = 900;

type BuildLineProps = {
  technologies: readonly string[];
  /** Only the open project's slot cycles. */
  active: boolean;
  /** Accessible name of the stack. */
  label: string;
  /** The control that steps on to the next technology. */
  nextLabel: string;
};

const BuildLine = ({ technologies, active, label, nextLabel }: BuildLineProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Grouped only for order: backend, data, frontend, AI, where it runs.
  const parts = groupTechnologies(technologies).flatMap(({ tags }) => tags);

  const [index, setIndex] = useState(0);
  // A project opened again starts its stack from the top, not where it was left.
  useEffect(() => {
    if (active) setIndex(0);
  }, [active]);
  const [held, setHeld] = useState(false);
  // Keyboard focus on the row's controls holds it too, as a resting pointer
  // does, so stepping with "next" is not raced by the timer.
  const [focused, setFocused] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  const bolt = useRef<SVGSVGElement>(null);

  // On screen, and the page in front: the only time it is worth running.
  const visible = useInView(slot);

  const running =
    active && visible && !held && !focused && !prefersReducedMotion && parts.length > 1;

  // One jolt: the text jitters and splits, the mark flickers, and halfway
  // through the next technology takes the slot. The timer runs it, and so
  // does a click on the slot.
  const pending = useRef(0);
  const joltAt = useRef(-Infinity);
  const jolt = useCallback(() => {
    const element = slot.current;
    if (!element || parts.length < 2) return;
    element.animate(
      [
        { translate: "0 0", textShadow: "none" },
        {
          translate: "-2px 0",
          textShadow: "-2px 0 hsl(var(--iris)), 2px 0 hsl(var(--blush-deep))",
          offset: 0.2,
        },
        {
          translate: "2px -1px",
          textShadow: "2px 0 hsl(var(--iris)), -2px 0 hsl(var(--blush-deep))",
          offset: 0.4,
        },
        {
          translate: "-1px 1px",
          textShadow: "-1px 0 hsl(var(--iris)), 1px 0 hsl(var(--blush-deep))",
          offset: 0.6,
        },
        { translate: "0 0", textShadow: "none" },
      ],
      { duration: JOLT_MS, easing: "steps(5, end)" },
    );
    bolt.current?.animate(
      [{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }],
      { duration: JOLT_MS, easing: "steps(5, end)" },
    );
    joltAt.current = performance.now();
    window.clearTimeout(pending.current);
    pending.current = window.setTimeout(
      () => setIndex((at) => (at + 1) % parts.length),
      JOLT_MS / 2,
    );
  }, [parts.length]);
  useEffect(() => () => window.clearTimeout(pending.current), []);

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => {
      if (!document.hidden) jolt();
    }, DWELL_MS);
    return () => window.clearInterval(tick);
  }, [running, jolt]);

  // The crackle between jolts: never over a jolt, which would cut it short.
  useEffect(() => {
    if (!running) return;
    let timer = 0;
    const crackle = () => {
      const element = slot.current;
      if (element && !document.hidden && performance.now() - joltAt.current > JOLT_MS) {
        const dx = Math.random() < 0.5 ? -1 : 1;
        element.animate(
          [
            { translate: "0 0", textShadow: "none" },
            {
              translate: `${dx}px 0`,
              textShadow: `${dx}px 0 hsl(var(--iris) / 0.6), ${-dx}px 0 hsl(var(--blush-deep))`,
              offset: 0.5,
            },
            { translate: "0 0", textShadow: "none" },
          ],
          { duration: CRACKLE_MS, easing: "steps(3, end)" },
        );
        bolt.current?.animate([{ opacity: 1 }, { opacity: 0.45 }, { opacity: 1 }], {
          duration: CRACKLE_MS,
          easing: "steps(3, end)",
        });
      }
      timer = window.setTimeout(
        crackle,
        CRACKLE_MIN_MS + Math.random() * (CRACKLE_MAX_MS - CRACKLE_MIN_MS),
      );
    };
    timer = window.setTimeout(crackle, CRACKLE_MIN_MS);
    return () => window.clearTimeout(timer);
  }, [running]);

  const at = index % Math.max(parts.length, 1);
  const part = parts[at];

  // The next control sits at the row's end, under the fixed chat button's
  // column (24px in, 56px wide) wherever the page's right gutter is narrower
  // than that: below lg (24px) and from lg until the content's 1160px cap
  // leaves 88px (48px, up to 1240px wide). There the row ends short of it.
  return (
    <div className="border-y border-border py-3 max-lg:pr-16 lg:max-[1239px]:pr-10">
      {/* The whole stack, for assistive technology, and on screen under
          reduced motion. */}
      <ul
        aria-label={label}
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-foreground",
          prefersReducedMotion ? "" : "sr-only",
        )}
      >
        {parts.map((tag) => (
          <li key={tag} className="inline-flex items-center gap-1.5">
            <TechMark tag={tag} className="size-4 shrink-0" />
            {tag}
          </li>
        ))}
      </ul>

      {!prefersReducedMotion && part && (
        // On a phone the name takes the first line, so a long one is never
        // cut, and where it stands and the controls take the second.
        <div
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
          }}
          className="flex flex-wrap items-center gap-x-3 sm:flex-nowrap"
        >
          <div
            aria-hidden="true"
            onPointerEnter={() => setHeld(true)}
            onPointerLeave={() => setHeld(false)}
            // A pointer resting on the slot holds it; a click steps on, with
            // the same jolt. Assistive technology has the whole stack in the
            // list above.
            onClick={jolt}
            className="flex min-w-0 cursor-pointer select-none max-sm:basis-full sm:flex-1"
          >
            <div ref={slot} className="flex min-w-0 items-baseline gap-2">
              <TechMark tag={part} markRef={bolt} className="size-5 shrink-0 self-center" />
              <span className="truncate font-mono text-base text-foreground">{part}</span>
            </div>
          </div>
          {/* Where in the stack, numbered as the sections are: a dot per
              technology no longer fits a long stack on a phone. */}
          <span
            aria-hidden="true"
            className="mr-auto shrink-0 font-mono text-meta tabular-nums text-muted-foreground sm:mr-0"
          >
            {formatCounter(at + 1, parts.length)}
          </span>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={jolt}
            className={cn(CONTROL, "-my-2")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BuildLine;
