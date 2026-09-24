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
            "block h-5 w-5 rounded-motif border md:h-6 md:w-6",
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
    <li ref={ref} className="flex flex-col gap-3 border-t border-border py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-card-title-sm font-semibold">{skill.name}</h3>
        <span className="font-mono text-meta text-foreground">
          {years !== null ? labels.years(years) : skill.level}
        </span>
      </div>
      {years !== null && <ModuleBar years={years} revealed={isRevealed} animate={animate} />}
      <p className="max-w-[38ch] text-sm text-muted-foreground">{skill.description}</p>
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
    // Two columns from lg: eight single-column rows gave the motif more page
    // than its information warranted.
    <ol className={cn("grid grid-cols-1 gap-x-6 border-b border-border lg:grid-cols-2", className)}>
      {rows.map((skill) => (
        <SkillRow key={skill.name} skill={skill} labels={labels} />
      ))}
    </ol>
  );
};

export default SkillYears;
