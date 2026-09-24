import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UiExperience } from "@/lib/experiencesService";

/**
 * One role, read as an entry rather than a card: the company first, because
 * the kit's voice puts the named fact before the adjective, then the position
 * and dates, then what was built. Achievements carry the kit's small navy
 * square rather than a bullet.
 */

export type RoleEntryLabels = {
  keyAchievements: string;
  technologies: string;
  /** Text of the ask-Vex control; `{company}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{company}` is replaced. */
  askVexQuestion: string;
};

const fill = (template: string, company: string) => template.replace("{company}", company);

type RoleEntryProps = {
  experience: UiExperience;
  labels: RoleEntryLabels;
  onAsk: (question: string) => void;
};

const RoleEntry = ({ experience, labels, onAsk }: RoleEntryProps) => (
  <article
    id={`role-${experience.id}`}
    className="grid scroll-mt-24 grid-cols-4 gap-x-6 gap-y-6 border-t border-border py-10 md:grid-cols-12 md:py-12"
  >
    <header className="col-span-4 md:col-span-4">
      <p className="font-mono text-meta text-iris">
        {experience.period}
        {experience.location && ` · ${experience.location}`}
      </p>
      <h2 className="mt-2 text-card-title-sm font-semibold md:text-card-title">
        {experience.company}
      </h2>
      <p className="mt-1 text-base text-muted-foreground">{experience.position}</p>
    </header>

    <div className="col-span-4 space-y-8 md:col-span-8 lg:col-span-7">
      {experience.description && (
        <p className="max-w-[65ch] text-base text-muted-foreground md:text-body-lg">
          {experience.description}
        </p>
      )}
      {experience.achievements.length > 0 && (
        <div>
          <h3 className="mb-3 font-mono text-meta uppercase tracking-wide text-muted-foreground">
            {labels.keyAchievements}
          </h3>
          <ul className="space-y-3">
            {experience.achievements.map((achievement) => (
              <li key={achievement} className="flex max-w-[65ch] gap-4 text-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-2 w-2 shrink-0 rounded-sm bg-primary"
                />
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {experience.technologies.length > 0 && (
        <div>
          <h3 className="mb-2 font-mono text-meta uppercase tracking-wide text-muted-foreground">
            {labels.technologies}
          </h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-foreground">
            {experience.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      )}
      <Button
        variant="link"
        size="sm"
        className="font-medium"
        onClick={() => onAsk(fill(labels.askVexQuestion, experience.company))}
      >
        <MessageSquare />
        {fill(labels.askVex, experience.company)}
      </Button>
    </div>
  </article>
);

export default RoleEntry;
