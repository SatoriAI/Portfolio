import { type CSSProperties, useState } from "react";

import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { UiSchool } from "@/lib/schoolsService";
import { cn } from "@/lib/utils";

/**
 * Three degrees in one subject at one university, read as what they are:
 * a single line of research, from the bachelor's thesis to the doctorate.
 *
 * The degree is the heading — Bachelor's, Master's, Doctoral — because the
 * subject is the same three times over and a heading that repeats is not a
 * heading. The research paragraph shows its first two sentences with the
 * rest a press away, and a line worth its own place (a prize) stands out of
 * the paragraph it was buried in.
 *
 * A hairline rail carries one module of the rhythm motif per degree; the
 * degree still in progress is the filled module. On a phone the rail runs
 * down the left; from lg it runs across the top and the three stand side by
 * side, the thread reading left to right in the order the work was done.
 */

export type ResearchThreadLabels = {
  advisor: string;
  researchAreas: string;
  more: string;
  less: string;
};

type ResearchThreadProps = {
  /** In chronological order, earliest first. */
  schools: readonly UiSchool[];
  labels: ResearchThreadLabels;
  /** One line per degree worth its own place, keyed by the degree's start date. */
  highlights?: Record<string, string>;
  className?: string;
};

/** The first `count` sentences and the rest, split at a full stop followed by a space. */
const splitSentences = (text: string, count: number): [string, string] => {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text];
  return [sentences.slice(0, count).join("").trim(), sentences.slice(count).join("").trim()];
};

type StationProps = {
  school: UiSchool;
  labels: ResearchThreadLabels;
  highlight?: string;
  current: boolean;
  className?: string;
  style?: CSSProperties;
};

const Station = ({ school, labels, highlight, current, className, style }: StationProps) => {
  const [open, setOpen] = useState(false);
  const [summary, rest] = splitSentences(school.research, 2);

  return (
    <li style={style} className={className}>
      <span
        aria-hidden="true"
        className={cn(
          "relative z-10 mt-0.5 block h-6 w-6 rounded-motif border lg:mt-0",
          current ? "border-primary bg-primary" : "border-iris bg-lavender",
        )}
      />
      <div className="min-w-0">
        <p className="font-mono text-meta text-iris">{school.period}</p>
        <h3 className="mt-2 text-card-title-sm font-semibold md:text-card-title">
          {school.degree || school.study}
        </h3>
        <p className="mt-1 text-base text-muted-foreground">
          {school.degree ? `${school.study} · ${school.university}` : school.university}
        </p>
        {highlight && (
          <p className="mt-4 flex gap-3 text-base text-foreground">
            <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-motif bg-primary" />
            <span>{highlight}</span>
          </p>
        )}
        {summary && (
          <p className="mt-4 max-w-[52ch] text-base text-muted-foreground">
            {summary}
            {open && rest && ` ${rest}`}
          </p>
        )}
        {rest && (
          <Button
            variant="link"
            className="mt-1 h-auto text-sm font-medium"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? labels.less : labels.more}
          </Button>
        )}
        <dl className="mt-4 space-y-2 font-mono text-meta">
          {school.advisor && (
            <div className="flex flex-wrap gap-x-3">
              <dt className="uppercase tracking-widest text-muted-foreground">{labels.advisor}</dt>
              <dd className="text-foreground">{school.advisor}</dd>
            </div>
          )}
          {school.areas.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <dt className="uppercase tracking-widest text-muted-foreground">
                {labels.researchAreas}
              </dt>
              <dd className="text-foreground">{school.areas.join(" · ")}</dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
};

const ResearchThread = ({ schools, labels, highlights = {}, className }: ResearchThreadProps) => {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLOListElement>();
  const animateEntrance = !prefersReducedMotion && !isInitiallyVisible;
  const drawn = !animateEntrance || isRevealed;

  return (
    <ol
      ref={ref}
      className={cn("relative grid gap-y-14 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-0", className)}
    >
      {/* The rail draws from the first degree towards the last. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-6 left-3 top-6 w-px origin-top bg-iris/40 lg:bottom-auto lg:left-3 lg:right-3 lg:top-3 lg:h-px lg:w-auto lg:origin-left",
          animateEntrance && "transition-transform duration-500 ease-brand",
          drawn ? "scale-y-100 lg:scale-x-100" : "scale-y-0 lg:scale-x-0 lg:scale-y-100",
        )}
      />
      {schools.map((school, index) => (
        <Station
          key={school.id}
          school={school}
          labels={labels}
          highlight={highlights[school.startDate]}
          current={!school.endDate}
          style={animateEntrance ? { transitionDelay: `${index * 60}ms` } : undefined}
          className={cn(
            "relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-6 md:gap-x-10 lg:grid-cols-1 lg:content-start lg:gap-x-0 lg:gap-y-6",
            animateEntrance && "transition-[opacity,transform] duration-400 ease-brand",
            drawn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        />
      ))}
    </ol>
  );
};

export default ResearchThread;
