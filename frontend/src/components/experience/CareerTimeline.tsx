import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { UiExperience } from "@/lib/experiencesService";
import { buildTimeline } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * The career drawn to scale, in the kit's motif vocabulary.
 *
 * Each role is a 2px iris line from its first month to its last, with a small
 * navy square at the start; the role still running ends in the navy dot, the
 * module that breaks the rhythm. Ticks are one per January. Roles that ran
 * at the same time stack into lanes, so an overlap is visible as two lines
 * one above the other. This is data, not decoration, and it is labelled as
 * data: every line carries its company, the axis carries its years, and the
 * caption says what the drawing is.
 *
 * Built as a CSS grid with one column per month rather than as an SVG so the
 * labels stay in CSS pixels at every width; an SVG would scale its text with
 * the viewBox. Each line is a link to the role's entry below. On first sight
 * each line grows from its first month to its last, earliest role first, so
 * the career is drawn in the order it happened.
 */

type CareerTimelineLabels = {
  /** Accessible name of the figure. */
  figure: string;
  caption: string;
  /** Marks the end of the running role. */
  now: string;
};

type CareerTimelineProps = {
  experiences: readonly UiExperience[];
  labels: CareerTimelineLabels;
  /** Injected so the layout is deterministic in tests and screenshots. */
  now?: Date;
  className?: string;
};

const LANE_HEIGHT_PX = 44;

const CareerTimeline = ({
  experiences,
  labels,
  now = new Date(),
  className,
}: CareerTimelineProps) => {
  const timeline = buildTimeline(experiences, now);
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const grown = !animateEntrance || isRevealed;
  if (timeline.spans.length === 0) return null;

  const byId = new Map(experiences.map((experience) => [experience.id, experience]));
  const percent = (month: number) => `${(month / timeline.months) * 100}%`;

  return (
    <figure ref={ref} aria-label={labels.figure} className={cn("w-full", className)}>
      <div className="relative">
        {/* Axis: a January tick per year, the year set beside it. */}
        <div aria-hidden="true" className="relative h-7 border-b border-border">
          {timeline.ticks.map((tick) => (
            <span
              key={tick.year}
              className="absolute bottom-0 flex flex-col items-start"
              style={{ left: percent(tick.month) }}
            >
              <span className="mb-1 ml-2 font-mono text-meta text-muted-foreground">
                {tick.year}
              </span>
              <span className="block h-2 w-px bg-iris" />
            </span>
          ))}
        </div>

        <ol
          className="grid gap-y-0 pt-4"
          style={{
            gridTemplateColumns: `repeat(${timeline.months}, minmax(0, 1fr))`,
            gridAutoRows: `${LANE_HEIGHT_PX}px`,
          }}
        >
          {timeline.spans.map((span, index) => {
            const experience = byId.get(span.id);
            if (!experience) return null;
            const delay = animateEntrance ? { transitionDelay: `${index * 150}ms` } : undefined;
            return (
              <li
                key={span.id}
                className="relative flex items-end"
                style={{
                  gridColumn: `${span.startMonth + 1} / ${span.endMonth + 1}`,
                  gridRow: span.lane + 1,
                }}
              >
                <a
                  href={`#role-${span.id}`}
                  aria-label={`${experience.company}, ${experience.period}`}
                  className="group relative block w-full rounded-xl pb-2 pt-5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background"
                >
                  <span
                    style={delay}
                    className={cn(
                      "absolute left-0 top-0 whitespace-nowrap text-sm font-medium text-foreground transition-[color,opacity] duration-400 ease-brand group-hover:text-iris",
                      !grown && "opacity-0",
                    )}
                  >
                    {experience.company}
                  </span>
                  <span className="relative block h-0.5 w-full">
                    <span
                      aria-hidden="true"
                      style={delay}
                      className={cn(
                        "absolute inset-0 origin-left bg-iris",
                        animateEntrance && "transition-transform duration-700 ease-brand",
                        grown ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-motif bg-primary"
                    />
                    {span.current && (
                      <span
                        aria-hidden="true"
                        style={
                          animateEntrance
                            ? { transitionDelay: `${index * 150 + 600}ms` }
                            : undefined
                        }
                        className={cn(
                          "absolute right-0 top-1/2 -translate-y-1/2",
                          animateEntrance && "transition-opacity duration-400 ease-brand",
                          !grown && "opacity-0",
                        )}
                      >
                        <span className="block h-3 w-3 rounded-full bg-primary" />
                        {/* Above the dot rather than after it: after it, the label
                            would stand outside the content column. */}
                        <span className="absolute bottom-full right-0 mb-1 font-mono text-meta text-foreground">
                          {labels.now}
                        </span>
                      </span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="mt-4 text-sm text-muted-foreground">{labels.caption}</figcaption>
    </figure>
  );
};

export default CareerTimeline;
