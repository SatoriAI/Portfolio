import type { UiSchool } from "@/lib/schoolsService";
import { cn } from "@/lib/utils";

/**
 * Three degrees in one subject at one university, read as what they are:
 * a single line of research, from the bachelor's thesis to the doctorate.
 *
 * A hairline rail runs down the left with one module of the rhythm motif
 * per degree; the degree still in progress is the filled module, the one
 * that breaks the pattern. Entries are in the order the work was done,
 * earliest first, because the thread reads forward.
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
  <ol className={cn("relative", className)}>
    <span
      aria-hidden="true"
      className="absolute bottom-6 left-3 top-6 w-px bg-iris/40 motion-reduce:transition-none"
    />
    {schools.map((school) => {
      const current = !school.endDate;
      return (
        <li
          key={school.id}
          className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-6 pb-14 last:pb-0 md:gap-x-10"
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative z-10 mt-0.5 block h-6 w-6 rounded-sm border",
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
              <p className="mt-5 max-w-[65ch] text-base text-muted-foreground md:text-body-lg">
                {school.research}
              </p>
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
