import type { ElementType, ReactNode } from "react";
import { MessageSquare } from "lucide-react";

import CompanyMark from "@/components/experience/CompanyMark";
import { Button } from "@/components/ui/button";
import type { UiExperience } from "@/lib/experiencesService";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * One role, read as an entry rather than a card: the company first, because
 * the kit's voice puts the named fact before the adjective, then the role and
 * dates, and beside them the stack: technologies, programming tools and, for
 * a training role, the topics taught. Then the story in the order it is
 * written: the product, the responsibility, selected contributions and what
 * came of them. List items carry the kit's small navy square rather than a
 * bullet. A role still written the old way shows its old paragraph and
 * achievements where the new sections are empty. Read inside the role's
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
  /** Text of the ask-Vex control; `{company}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{company}` is replaced. */
  askVexQuestion: string;
};

type RoleEntryProps = {
  experience: UiExperience;
  labels: RoleEntryLabels;
  onAsk: (question: string) => void;
  /** The company's heading; a dialog passes its own, which names it. */
  Heading?: ElementType<{ className?: string; children: ReactNode }>;
};

const LABEL = "font-mono text-meta uppercase tracking-widest text-muted-foreground";
const PROSE = "max-w-[52ch] text-base text-muted-foreground md:text-body-lg";

/** A titled part of the entry; nothing at all when it has nothing to say. */
const Part = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h3 className={cn("mb-2", LABEL)}>{title}</h3>
    {children}
  </section>
);

/** Names set as a quiet run of mono words: technologies, tools, topics. */
const Names = ({ title, names }: { title: string; names: readonly string[] }) =>
  names.length > 0 ? (
    <Part title={title}>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm text-foreground md:max-w-[28ch]">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </Part>
  ) : null;

/** Text split into its paragraphs at blank lines, as it was written. */
const paragraphsOf = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

/** Paragraphs under their title. */
const Prose = ({ title, text }: { title: string; text: string }) =>
  text ? (
    <Part title={title}>
      <div className="space-y-4">
        {paragraphsOf(text).map((paragraph) => (
          <p key={paragraph} className={PROSE}>
            {paragraph}
          </p>
        ))}
      </div>
    </Part>
  ) : null;

/** Sentences, each marked with the kit's square. */
const Points = ({ title, points }: { title: string; points: readonly string[] }) =>
  points.length > 0 ? (
    <Part title={title}>
      <ul className="space-y-3">
        {points.map((point) => (
          <li key={point} className="flex max-w-[52ch] gap-4 text-foreground">
            <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-motif bg-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </Part>
  ) : null;

const RoleEntry = ({ experience, labels, onAsk, Heading = "h2" }: RoleEntryProps) => (
  <article className="grid grid-cols-4 gap-x-6 gap-y-6 md:grid-cols-12">
    {/* From md the role's facts stay in view beside a long story. */}
    <header className="col-span-4 md:sticky md:top-0 md:col-span-5 md:self-start">
      <CompanyMark company={experience.company} className="size-14 text-sm" />
      <p className="mt-4 font-mono text-meta text-iris">
        {experience.period}
        {experience.location && ` · ${experience.location}`}
      </p>
      <Heading className="mt-2 text-card-title-sm font-semibold md:text-card-title">
        {experience.company}
      </Heading>
      <p className="mt-1 text-base text-muted-foreground">{experience.role}</p>
      <div className="mt-6 space-y-5">
        <Names title={labels.technologies} names={experience.technologies} />
        <Names title={labels.tools} names={experience.tools} />
        <Names title={labels.topics} names={experience.topics} />
      </div>
    </header>

    <div className="col-span-4 space-y-8 md:col-span-7">
      <Prose title={labels.product} text={experience.product} />
      <Prose title={labels.responsibilities} text={experience.responsibilities} />
      {experience.description && <p className={PROSE}>{experience.description}</p>}
      <Points title={labels.contributions} points={experience.contributions} />
      <Points title={labels.results} points={experience.results} />
      <Points title={labels.keyAchievements} points={experience.achievements} />
      <Button
        variant="link"
        className="h-auto whitespace-normal px-0 text-left text-sm font-medium"
        onClick={() => onAsk(fillTemplate(labels.askVexQuestion, { company: experience.company }))}
      >
        <MessageSquare />
        {fillTemplate(labels.askVex, { company: experience.company })}
      </Button>
    </div>
  </article>
);

export default RoleEntry;
