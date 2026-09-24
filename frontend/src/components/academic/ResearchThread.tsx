import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { UiSchool } from "@/lib/schoolsService";
import { cn } from "@/lib/utils";

/**
 * Three degrees in one subject at one university, read as what they are:
 * a single line of research, from the bachelor's thesis to the doctorate.
 *
 * A hairline rail carries one module of the rhythm motif per degree; the
 * degree still in progress is the filled module, the one that breaks the
 * pattern. On a phone the rail runs down the left and the entries stack. From
 * lg it runs across the top and the three degrees stand side by side, so the
 * thread reads left to right in the order the work was done.
 */

export type ResearchThreadLabels = {
  advisor: string;
  researchAreas: string;
};

type ResearchThreadProps = {
  /** In chronological order, earliest first. */
  schools: readonly UiSchool[];
  labels: ResearchThreadLabels;
  className?: string;
};

const ResearchThread = ({ schools, labels, className }: ResearchThreadProps) => {
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
          animateEntrance && "transition-transform duration-700 ease-brand",
          drawn ? "scale-y-100 lg:scale-x-100" : "scale-y-0 lg:scale-x-0 lg:scale-y-100",
        )}
      />
      {schools.map((school, index) => {
        const current = !school.endDate;
        return (
          <li
            key={school.id}
            style={animateEntrance ? { transitionDelay: `${index * 150}ms` } : undefined}
            className={cn(
              "relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-6 md:gap-x-10 lg:grid-cols-1 lg:content-start lg:gap-x-0 lg:gap-y-6",
              animateEntrance && "transition-[opacity,transform] duration-400 ease-brand",
              drawn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-0.5 block h-6 w-6 rounded-motif border lg:mt-0",
                current ? "border-primary bg-primary" : "border-iris bg-lavender",
              )}
            />
            <div className="min-w-0">
              <p className="font-mono text-meta text-iris">
                {[school.degree, school.period].filter(Boolean).join(" · ")}
              </p>
              <h3 className="mt-2 text-card-title-sm font-semibold md:text-card-title">
                {school.study}
              </h3>
              <p className="mt-1 text-base text-muted-foreground">{school.university}</p>
              {school.research && (
                <p className="mt-5 max-w-[52ch] text-base text-muted-foreground">
                  {school.research}
                </p>
              )}
              <dl className="mt-5 space-y-2 font-mono text-meta">
                {school.advisor && (
                  <div className="flex flex-wrap gap-x-3">
                    <dt className="uppercase tracking-widest text-muted-foreground">
                      {labels.advisor}
                    </dt>
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
      })}
    </ol>
  );
};

export default ResearchThread;
