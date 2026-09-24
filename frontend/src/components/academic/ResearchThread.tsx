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

const ResearchThread = ({ schools, labels, className }: ResearchThreadProps) => (
  <ol className={cn("relative grid gap-y-14 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-0", className)}>
    <span
      aria-hidden="true"
      className="absolute bottom-6 left-3 top-6 w-px bg-iris/40 lg:bottom-auto lg:left-3 lg:right-3 lg:top-3 lg:h-px lg:w-auto"
    />
    {schools.map((school) => {
      const current = !school.endDate;
      return (
        <li
          key={school.id}
          className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-6 md:gap-x-10 lg:grid-cols-1 lg:gap-x-0 lg:gap-y-6"
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative z-10 mt-0.5 block h-6 w-6 rounded-sm border lg:mt-0",
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
              <p className="mt-5 max-w-[65ch] text-base text-muted-foreground">{school.research}</p>
            )}
            <dl className="mt-5 space-y-2 font-mono text-meta">
              {school.advisor && (
                <div className="flex flex-wrap gap-x-3">
                  <dt className="uppercase tracking-wide text-muted-foreground">
                    {labels.advisor}
                  </dt>
                  <dd className="text-foreground">{school.advisor}</dd>
                </div>
              )}
              {school.areas.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <dt className="uppercase tracking-wide text-muted-foreground">
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

export default ResearchThread;
