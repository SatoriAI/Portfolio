import { type ElementType, type ReactNode, useRef } from "react";

import AskVexPrompt from "@/components/AskVexPrompt";
import CompanyMark from "@/components/experience/CompanyMark";
import { useFitsScrollport } from "@/hooks/use-fits-scrollport";
import type { UiExperience } from "@/lib/experiencesService";
import { fillTemplate, paragraphsOf } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * One role, read as an entry rather than a card, in two columns from md. The
 * left one is the gist a reader takes in first: the company (named fact
 * before adjective, as the kit's voice puts it), the role and dates, what came
 * of the work, set apart in lavender so it is seen before anything else, then
 * the stack (technologies, programming tools and, for a training role, the
 * topics taught) and the way to ask Vex. The right one is the story in the
 * order it is written: the product, the responsibility, the selected
 * contributions. On a phone the same order runs down one column, the logo
 * beside the name. A role still written the old way shows its old paragraph
 * and achievements where the new sections are empty. Read inside the role's
 * dialog, so the company is the dialog's title, and its circle from the
 * timeline heads the entry.
 */

export type RoleEntryLabels = {
  technologies: string;
  tools: string;
  topics: string;
  product: string;
  responsibilities: string;
  contributions: string;
  results: string;
  keyAchievements: string;
  /** What the ask-Vex control does, read after its name; `{company}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{company}` is replaced. */
  askVexQuestion: string;
  /** The language's quotation marks around `{text}`, for the question shown. */
  quoted: string;
};

type RoleEntryProps = {
  experience: UiExperience;
  labels: RoleEntryLabels;
  onAsk: (question: string) => void;
  /** The company's heading; a dialog passes its own, which names it. */
  Heading?: ElementType<{ className?: string; children: ReactNode }>;
};

const LABEL = "font-mono text-meta uppercase tracking-widest text-muted-foreground";
/** The story is what the entry is for, so it is set in ink, not the muted grey. */
const PROSE = "text-base text-foreground/80 md:text-body-lg";

/** A titled part of the entry. */
const Part = ({
  title,
  children,
  className,
  titleClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}) => (
  <section className={className}>
    <h3 className={cn("mb-2", LABEL, titleClassName)}>{title}</h3>
    {children}
  </section>
);

/** Names set as a quiet run of mono words: technologies, tools, topics. */
const Names = ({ title, names }: { title: string; names: readonly string[] }) =>
  names.length > 0 ? (
    <Part title={title}>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm text-foreground">
        {names.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    </Part>
  ) : null;

/** Paragraphs under their title. */
const Prose = ({ title, text }: { title: string; text: string }) =>
  text ? (
    <Part title={title}>
      <div className="space-y-4">
        {paragraphsOf(text).map((paragraph, index) => (
          <p key={index} className={PROSE}>
            {paragraph}
          </p>
        ))}
      </div>
    </Part>
  ) : null;

/** Sentences, each marked with the kit's square; one alone needs no mark. */
const Marked = ({ points, className }: { points: readonly string[]; className?: string }) =>
  points.length === 1 ? (
    <p className={className}>{points[0]}</p>
  ) : (
    <ul className="space-y-3">
      {points.map((point, index) => (
        <li key={index} className={cn("flex gap-4", className)}>
          <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-motif bg-primary" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );

const Points = ({ title, points }: { title: string; points: readonly string[] }) =>
  points.length > 0 ? (
    <Part title={title}>
      <Marked points={points} className="text-foreground" />
    </Part>
  ) : null;

/** What came of the work, set apart so it is the first thing read after the role. */
const Results = ({ title, points }: { title: string; points: readonly string[] }) =>
  points.length > 0 ? (
    <Part
      title={title}
      titleClassName="text-iris"
      className="rounded-lg bg-lavender/45 px-5 pb-5 pt-4"
    >
      <Marked points={points} className="text-base text-foreground" />
    </Part>
  ) : null;

const RoleEntry = ({ experience, labels, onAsk, Heading = "h2" }: RoleEntryProps) => {
  const gist = useRef<HTMLElement>(null);
  const fits = useFitsScrollport(gist);
  const question = fillTemplate(labels.askVexQuestion, { company: experience.company });
  return (
    <article className="grid grid-cols-4 gap-x-6 gap-y-8 md:grid-cols-12">
      {/* The gist stays in view beside a long story, Vex with it, but only
        where the dialog's body can hold the whole column: a taller one would
        keep the Vex pill out of sight until the story's end, so it scrolls
        with the story instead, as on a phone. Its top matches the body's own
        top padding. */}
      <header
        ref={gist}
        className={cn(
          "col-span-4 space-y-6 md:col-span-5 md:self-start",
          fits && "md:sticky md:top-8",
        )}
      >
        <div>
          {/* On a phone the logo stands beside the name, sparing the first screen. */}
          <div className="flex items-center gap-4 md:block">
            <CompanyMark
              company={experience.company}
              className="size-12 shrink-0 text-sm md:size-14"
            />
            <div className="min-w-0 md:mt-4">
              <p className="font-mono text-meta text-iris">
                {experience.period}
                {experience.location && ` · ${experience.location}`}
              </p>
              <Heading className="mt-1 text-card-title-sm font-semibold md:mt-2 md:text-card-title">
                {experience.company}
              </Heading>
            </div>
          </div>
          <p className="mt-1 text-base text-muted-foreground">{experience.role}</p>
        </div>
        <Results title={labels.results} points={experience.results} />
        <Names title={labels.technologies} names={experience.technologies} />
        <Names title={labels.tools} names={experience.tools} />
        <Names title={labels.topics} names={experience.topics} />
        <AskVexPrompt
          question={question}
          quoted={labels.quoted}
          hint={fillTemplate(labels.askVex, { company: experience.company })}
          onAsk={onAsk}
        />
      </header>

      <div className="col-span-4 space-y-8 md:col-span-7">
        <Prose title={labels.product} text={experience.product} />
        <Prose title={labels.responsibilities} text={experience.responsibilities} />
        {experience.description && <p className={PROSE}>{experience.description}</p>}
        <Points title={labels.contributions} points={experience.contributions} />
        <Points title={labels.keyAchievements} points={experience.achievements} />
      </div>
    </article>
  );
};

export default RoleEntry;
