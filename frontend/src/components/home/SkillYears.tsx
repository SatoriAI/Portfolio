import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { UiSkill } from "@/lib/skillsService";
import { parseYears } from "@/lib/skillYears";
import { cn } from "@/lib/utils";

/**
 * Skills as a ledger of years, drawn in the kit's own module vocabulary.
 *
 * Each counted year is one 24px module on the rhythm grid; the year still
 * running — the "+" in "10+ years" — is the single filled module that breaks
 * the pattern, which is what the kit's rhythm motif has always kept that
 * module for. The number is printed beside the bar, so the geometry never
 * carries the information alone.
 *
 * Rows are ordered by years, longest first, so the page reads as a chart.
 * A skill whose level is not a count keeps its text and gets no bar.
 */

const MODULE_STAGGER_MS = 30;

type SkillYearsLabels = {
  /** "10+ yrs", in the page's language. */
  years: (count: number) => string;
};

type ModuleBarProps = {
  years: number;
  revealed: boolean;
  animate: boolean;
};

const ModuleBar = ({ years, revealed, animate }: ModuleBarProps) => (
  <span aria-hidden="true" className="flex flex-wrap gap-2">
    {Array.from({ length: years + 1 }, (_, index) => {
      const running = index === years;
      return (
        <span
          key={index}
          style={animate ? { transitionDelay: `${index * MODULE_STAGGER_MS}ms` } : undefined}
          className={cn(
            "block h-5 w-5 rounded-sm border md:h-6 md:w-6",
            running ? "border-primary bg-primary" : "border-iris bg-lavender",
            animate && "transition-[opacity,transform] duration-400 ease-brand",
            animate && !revealed && "translate-y-2 opacity-0",
          )}
        />
      );
    })}
  </span>
);

type SkillRowProps = {
  skill: UiSkill;
  labels: SkillYearsLabels;
};

const SkillRow = ({ skill, labels }: SkillRowProps) => {
  const years = parseYears(skill.level);
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLLIElement>();
  const animate = !prefersReducedMotion && !isInitiallyVisible;

  return (
    <li
      ref={ref}
      className="grid grid-cols-4 gap-x-6 gap-y-3 py-5 md:grid-cols-12 md:items-baseline md:py-6"
    >
      <div className="col-span-4 md:col-span-5">
        <h3 className="text-card-title-sm font-semibold">{skill.name}</h3>
        <p className="mt-1 max-w-[45ch] text-base text-muted-foreground">{skill.description}</p>
      </div>
      <div className="col-span-4 flex flex-wrap items-center gap-x-4 gap-y-2 md:col-span-7">
        {years !== null && <ModuleBar years={years} revealed={isRevealed} animate={animate} />}
        <span className="font-mono text-meta text-foreground">
          {years !== null ? labels.years(years) : skill.level}
        </span>
      </div>
    </li>
  );
};

type SkillYearsProps = {
  skills: readonly UiSkill[];
  labels: SkillYearsLabels;
  className?: string;
};

const SkillYears = ({ skills, labels, className }: SkillYearsProps) => {
  const rows = [...skills].sort(
    (a, b) => (parseYears(b.level) ?? -1) - (parseYears(a.level) ?? -1),
  );
  return (
    <ol className={cn("divide-y divide-border border-y border-border", className)}>
      {rows.map((skill) => (
        <SkillRow key={skill.name} skill={skill} labels={labels} />
      ))}
    </ol>
  );
};

export default SkillYears;
