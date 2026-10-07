import { useLayoutEffect, useRef, useState } from "react";

import { useDismissOutside } from "@/hooks/use-dismiss-outside";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { clamp01, easeOutCubic } from "@/lib/motion";
import { segmentQuote, themeCounts, type ThemePhrases, themesIn } from "@/lib/quoteThemes";
import type { UiTestimonial } from "@/lib/testimonialsService";
import { cn } from "@/lib/utils";

import "@fontsource/caveat/latin-500.css";
import "@fontsource/caveat/latin-ext-500.css";

/**
 * What students wrote, and what they keep saying. Above the quotes, the
 * themes that recur in them — explains simply, beyond the syllabus —
 * each with how many reviews say it. Pressing a theme marks, in each quote,
 * the students' own words that say it, and lets the quotes that do not say
 * it recede; pressing it again, or anywhere outside the themes, lets them
 * all back. So a claim about the teaching is never the page's: it is a
 * count, and the words behind it.
 *
 * The counts are taken from the phrases actually found in the reviews as
 * they read now, so a theme no review says any more is left out rather than
 * shown with a number it cannot back. All six quotes are shown, on a grid
 * that fills the row and reads left to right. A grid and not CSS columns:
 * Chrome can fail to paint transformed, layered items in the second and
 * third column of a multi-column box, and the notes are both.
 *
 * Each quote is a sticky note — yellow, faintly ruled, a deeper band where
 * the glue is — with the student's words in handwriting and the course typed
 * under them. The notes sit a degree off square, the next the other way, as
 * notes stuck up by hand, and they are stuck up as the reader scrolls to
 * them: each comes down onto the wall square and a little lifted, presses
 * flat and turns to its tilt, the next in the row a moment later; scrolling
 * back up takes them down again. Only the scroll moves them. Pressing a
 * theme draws a highlighter over the words that say it, stroke by stroke,
 * note by note. The words stand without quotation marks: a note in
 * someone's hand is already plainly theirs. Pressing a theme squares up the
 * notes that say it while the rest recede, so the motion answers the
 * reader's choice rather than promising that a note can be pressed. The
 * handwriting sits on the rules: both run at 28px.
 *
 * Yellow, the handwriting and the shadow are all outside the kit, which
 * keeps elevation for what is actionable: here the shadow is what makes a
 * note read as paper stuck on the page, and it is the lightest in the ramp.
 * The handwriting (Caveat) carries the Polish diacritics, and only its Latin
 * subsets are loaded.
 */

export type QuoteTheme = { key: string; label: string };

type QuoteWallProps = {
  testimonials: readonly UiTestimonial[];
  /** The themes, in the order they are offered. */
  themes: readonly QuoteTheme[];
  /** Per review id, the words that say each theme. */
  evidence: Readonly<Record<string, ThemePhrases>>;
  labels: {
    /** Names the row of themes. */
    themes: string;
  };
  className?: string;
};

/**
 * A note is stuck up while its top travels from the bottom of the screen up
 * this fraction of it, each further along its row this much later.
 */
const PIN_RANGE = 0.3;
const PIN_STAGGER = 0.2;

/**
 * A highlighter over the lower part of the words, drawn once across them:
 * sliced, not cloned, across the lines, so a phrase that wraps is marked to
 * the end of one line before the next, as a hand would.
 */
const MARKER = {
  backgroundImage:
    "linear-gradient(hsl(var(--lavender-deep) / 0.7), hsl(var(--lavender-deep) / 0.7))",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "0 90%",
  backgroundSize: "100% 70%",
  boxDecorationBreak: "slice",
  WebkitBoxDecorationBreak: "slice",
} as const;
/** Each note is marked a moment after the one before; within a note, one phrase after another. */
const MARK_NOTE_STAGGER_MS = 140;
const MARK_PHRASE_GAP_MS = 120;
/** A stroke's length sets its time, within bounds, as a hand's would. */
const markMs = (text: string) => Math.min(900, Math.max(300, text.length * 22));

/** A rule under every line of the quote, at its 28px line height. */
const RULED = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0 27px, hsl(var(--note-rule) / 0.3) 27px 28px)",
};

const QuoteWall = ({ testimonials, themes, evidence, labels, className }: QuoteWallProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const group = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // The notes stuck up with the scroll. Each slot is measured and left still;
  // the note inside it moves, so the measure never chases the motion. Before
  // the first paint, so a note below never shows and then vanishes.
  useScrollFrame(
    () => {
      const wall = grid.current;
      if (!wall) return;
      const height = window.innerHeight;
      const columns = getComputedStyle(wall).gridTemplateColumns.split(" ").length;
      // Every slot is measured before any is changed, so the frame lays the
      // page out once rather than once per note.
      const slots = [...wall.children].map((slot) => ({
        slot,
        top: slot.getBoundingClientRect().top,
      }));
      slots.forEach(({ slot, top }, index) => {
        const note = slot.firstElementChild as HTMLElement | null;
        if (!(slot instanceof HTMLElement) || !note) return;
        const raw = (height - top) / (height * PIN_RANGE) - (index % columns) * PIN_STAGGER;
        const pinned = easeOutCubic(clamp01(raw));
        const tilt = Number(note.dataset.tilt ?? 0);
        slot.style.opacity = String(clamp01(raw * 1.6));
        note.style.translate = `0 ${(-14 * (1 - pinned)).toFixed(2)}px`;
        note.style.scale = String(1 + 0.05 * (1 - pinned));
        // Against the note's own tilt, so it comes in square and turns.
        note.style.rotate = `${(-tilt * (1 - pinned)).toFixed(3)}deg`;
      });
    },
    { watch: [testimonials], enabled: !prefersReducedMotion },
  );
  // Turned off mid-visit, reduced motion leaves every note where it belongs.
  useLayoutEffect(() => {
    const wall = grid.current;
    if (!wall || !prefersReducedMotion) return;
    [...wall.children].forEach((slot) => {
      if (!(slot instanceof HTMLElement)) return;
      slot.style.opacity = "";
      const note = slot.firstElementChild as HTMLElement | null;
      note?.style.removeProperty("translate");
      note?.style.removeProperty("scale");
      note?.style.removeProperty("rotate");
    });
  }, [prefersReducedMotion]);

  // While a theme is chosen, a press anywhere but on the themes clears it.
  useDismissOutside(selected !== null, group, () => setSelected(null));

  const phrasesOf = (testimonial: UiTestimonial) => evidence[String(testimonial.id)] ?? {};
  const counts = themeCounts(
    testimonials.map((testimonial) => ({
      text: testimonial.text,
      phrases: phrasesOf(testimonial),
    })),
    themes.map((theme) => theme.key),
  );
  const offered = themes.filter((theme) => counts[theme.key] > 0);

  return (
    <div className={className}>
      {offered.length > 0 && (
        <div className="mb-10">
          <p className="mb-3 font-mono text-meta uppercase tracking-widest text-muted-foreground">
            {labels.themes}
          </p>
          <div ref={group} role="group" aria-label={labels.themes} className="flex flex-wrap gap-2">
            {offered.map((theme) => {
              const pressed = theme.key === selected;
              return (
                <button
                  key={theme.key}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setSelected(pressed ? null : theme.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    pressed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-control-border bg-card text-foreground hover:border-iris hover:text-iris",
                  )}
                >
                  {theme.label}
                  {/* Joined by hand: cn would read text-meta as a colour and drop it. */}
                  <span
                    className={`font-mono text-meta ${
                      pressed ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {counts[theme.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div ref={grid} className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => {
          const phrases = phrasesOf(testimonial);
          const says = selected === null || themesIn(testimonial.text, phrases).has(selected);
          // Where this note's first stroke starts: after the notes before it
          // that say the theme, and each stroke here after the last.
          const marked = testimonials
            .slice(0, index)
            .filter(
              (before) =>
                selected !== null && themesIn(before.text, phrasesOf(before)).has(selected),
            ).length;
          let strokeAt = marked * MARK_NOTE_STAGGER_MS;
          return (
            <div key={testimonial.id} className="min-w-0">
              <figure
                // Its tilt at rest, which it turns to as it is stuck up.
                data-tilt={selected !== null && says ? 0 : index % 2 ? 1 : -1}
                className={cn(
                  "relative rounded-motif bg-note px-6 pb-6 pt-8 shadow-md",
                  "transition-[opacity,transform] duration-200 ease-brand motion-reduce:transition-opacity",
                  says ? "opacity-100" : "opacity-40",
                  // Squared up while its theme is chosen; otherwise a degree
                  // off, alternating.
                  selected !== null && says ? "rotate-0" : index % 2 ? "rotate-1" : "-rotate-1",
                )}
              >
                {/* The glue strip across the top of the note. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-6 rounded-t-motif bg-note-rule/10"
                />
                <blockquote
                  className="font-hand text-[22px] font-medium leading-7 text-foreground"
                  style={RULED}
                >
                  {segmentQuote(testimonial.text, phrases).map((segment, part) => {
                    if (!(segment.theme && segment.theme === selected)) {
                      return <span key={part}>{segment.text}</span>;
                    }
                    const duration = markMs(segment.text);
                    const delay = strokeAt;
                    strokeAt += duration + MARK_PHRASE_GAP_MS;
                    return (
                      <mark
                        key={part}
                        className="animate-marker bg-transparent px-0.5 text-foreground motion-reduce:animate-none"
                        style={{
                          ...MARKER,
                          animationDelay: `${delay}ms`,
                          animationDuration: `${duration}ms`,
                        }}
                      >
                        {segment.text}
                      </mark>
                    );
                  })}
                </blockquote>
                <figcaption className="mt-4 font-mono text-meta text-muted-foreground">
                  {testimonial.course} · {testimonial.semester}
                </figcaption>
              </figure>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuoteWall;
