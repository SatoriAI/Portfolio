import { MessageSquare } from "lucide-react";

import CompanyMark from "@/components/experience/CompanyMark";
import { Button } from "@/components/ui/button";
import type { UiExperience } from "@/lib/experiencesService";
import { fillTemplate } from "@/lib/text";

/**
 * One role, read as an entry rather than a card: the company first, because
 * the kit's voice puts the named fact before the adjective, then the position
 * and dates, then what was built. Achievements carry the kit's small navy
 * square rather than a bullet. Read inside the role's dialog, so the company
 * is the dialog's title, and its circle from the timeline heads the entry.
 */

export type RoleEntryLabels = {
  keyAchievements: string;
  technologies: string;
  /** Text of the ask-Vex control; `{company}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{company}` is replaced. */
  askVexQuestion: string;
};

type RoleEntryProps = {
  experience: UiExperience;
  labels: RoleEntryLabels;
  onAsk: (question: string) => void;
};

const RoleEntry = ({ experience, labels, onAsk }: RoleEntryProps) => (
  <article className="grid grid-cols-4 gap-x-6 gap-y-6 md:grid-cols-12">
    <header className="col-span-4 md:col-span-5">
      <CompanyMark company={experience.company} className="size-14 text-sm" />
      <p className="mt-4 font-mono text-meta text-iris">
        {experience.period}
        {experience.location && ` · ${experience.location}`}
      </p>
      <h3 className="mt-2 text-card-title-sm font-semibold md:text-card-title">
        {experience.company}
      </h3>
      <p className="mt-1 text-base text-muted-foreground">{experience.position}</p>
      {experience.technologies.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-mono text-meta uppercase tracking-widest text-muted-foreground">
            {labels.technologies}
          </h3>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm text-foreground md:max-w-[28ch]">
            {experience.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      )}
    </header>

    <div className="col-span-4 space-y-8 md:col-span-7">
      {experience.description && (
        <p className="max-w-[52ch] text-base text-muted-foreground md:text-body-lg">
          {experience.description}
        </p>
      )}
      {experience.achievements.length > 0 && (
        <div>
          <h3 className="mb-3 font-mono text-meta uppercase tracking-widest text-muted-foreground">
            {labels.keyAchievements}
          </h3>
          <ul className="space-y-3">
            {experience.achievements.map((achievement) => (
              <li key={achievement} className="flex max-w-[52ch] gap-4 text-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-2 w-2 shrink-0 rounded-motif bg-primary"
                />
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
