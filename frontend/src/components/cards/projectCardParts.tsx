import { ExternalLink, Github } from "lucide-react";

import RhythmMotif from "@/components/brand/RhythmMotif";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectPrimaryHref } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

export type ProjectLabels = {
  code: string;
  demo: string;
  /** Shown when neither code nor demo link exists. */
  privateProject: string;
  /** Image alt template; `{title}` is replaced with the project title. */
  imageAlt: string;
};

const mediaCornersClassName = {
  top: "rounded-t-card",
  left: "rounded-t-card md:rounded-l-card md:rounded-tr-none",
} as const;

type ProjectMediaProps = {
  project: UiProject;
  labels: ProjectLabels;
  /**
   * Which corners the panel rounds. The panel clips rather than the Card,
   * because a clipping Card would cut off the stretched link's focus ring.
   */
  corners: keyof typeof mediaCornersClassName;
  className?: string;
};

export const ProjectMedia = ({ project, labels, corners, className }: ProjectMediaProps) => (
  <div
    className={cn(
      "relative flex aspect-video items-center justify-center overflow-hidden bg-lavender",
      mediaCornersClassName[corners],
      className,
    )}
  >
    {project.image ? (
      <img
        src={project.image}
        alt={labels.imageAlt.replace("{title}", project.title)}
        // Absolute so the image fills the panel instead of sizing it. Left in
        // flow it contributes its own intrinsic height — which on the wide card
        // made the media taller than the text beside it and reopened the gap
        // above the buttons that this card exists to avoid.
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
    ) : (
      // Decoration falls to the kit's geometric motif; the mark stays reserved
      // for identity.
      <RhythmMotif className="h-8" />
    )}
  </div>
);

type LinkButtonProps = {
  href: string;
  icon: typeof Github;
  label: string;
  /** The page shows one "Code" link per project; this tells them apart. */
  project: string;
};

const LinkButton = ({ href, icon: Icon, label, project }: LinkButtonProps) => (
  <Button variant="outline" size="sm" className="flex-1" asChild>
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} — ${project}`}>
      <Icon />
      {label}
    </a>
  </Button>
);

type ProjectBodyProps = {
  project: UiProject;
  labels: ProjectLabels;
};

export const ProjectBody = ({ project, labels }: ProjectBodyProps) => {
  const primaryHref = projectPrimaryHref(project);
  const hasLinks = Boolean(project.github || project.demo);

  return (
    <div className="flex flex-1 flex-col">
      <CardHeader>
        <CardTitle>
          {primaryHref ? (
            // Stretched link: the title is the real anchor and its ::after
            // covers the card, so the whole card is one target while Code and
            // Demo stay plain siblings rather than nested interactive elements.
            // The ring is drawn on the overlay, so focus traces the card rather
            // than the few words of the title.
            //
            // The cost is that the description is no longer selectable. That is
            // the standard trade for this pattern — do not "fix" it by raising
            // the paragraph above the overlay, which would give a card that
            // lifts on hover but does not navigate where the cursor actually is.
            <a
              href={primaryHref}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              className="rounded-card outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-[3px] focus-visible:after:ring-offset-background group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
            >
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        {/* Not flex-1: growing the paragraph to fill the card is what opened a
            ~140px hole between the description and the tags on the wide card.
            The footer below claims the slack instead. */}
        <p className="text-base text-muted-foreground">{project.description}</p>
        {project.technologies.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Technologies">
            {project.technologies.map((tech) => (
              <li key={tech}>
                <Badge>{tech}</Badge>
              </li>
            ))}
          </ul>
        )}
        {hasLinks ? (
          // Raised above the overlay so both buttons stay clickable and
          // keyboard reachable.
          <div className="relative z-10 mt-auto flex gap-2">
            {project.github && (
              <LinkButton
                href={project.github}
                icon={Github}
                label={labels.code}
                project={project.title}
              />
            )}
            {project.demo && (
              <LinkButton
                href={project.demo}
                icon={ExternalLink}
                label={labels.demo}
                project={project.title}
              />
            )}
          </div>
        ) : (
          <p className="mt-auto font-mono text-meta text-muted-foreground">
            {labels.privateProject}
          </p>
        )}
      </CardContent>
    </div>
  );
};
