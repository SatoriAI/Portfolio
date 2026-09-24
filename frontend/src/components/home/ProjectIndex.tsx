import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ExternalLink, Github, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { isThisSite } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

/**
 * Projects as an index rather than a grid of cards.
 *
 * On a desktop the titles stand in a column on the left, numbered, each with
 * one module of the rhythm motif before it; the selected project's module is
 * the filled one, the kit's device for the module that breaks the pattern.
 * Pointing at a title, focusing it or pressing an arrow key opens it in the
 * panel on the right, where the project is read in sequence: what it is, what
 * it was built with, where it runs, and a way to ask Vex about it. The panel
 * enters with the kit's 8px rise.
 *
 * The images the backend holds are app icons, so they are shown as icons — a
 * 72px rounded tile — instead of being stretched into 16:9 hero crops.
 *
 * One of the projects is this site. Its title carries a small note saying so:
 * it is the one project the visitor is already inside.
 *
 * On a phone there is no room for two columns; the projects stack, separated
 * by rules, each read in the same sequence.
 */

export type ProjectIndexLabels = {
  code: string;
  demo: string;
  /** Shown when neither code nor demo link exists. */
  privateProject: string;
  /** Image alt template; `{title}` is replaced with the project title. */
  imageAlt: string;
  /** Heading of the technology list. */
  stack: string;
  /** Note beside the project that is this site. */
  youAreHere: string;
  /** Text of the ask-Vex control; `{title}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{title}` is replaced. */
  askVexQuestion: string;
};

const fill = (template: string, title: string) => template.replace("{title}", title);
const index = (position: number) => String(position + 1).padStart(2, "0");

type ProjectIconProps = {
  project: UiProject;
  alt: string;
  className?: string;
};

const ProjectIcon = ({ project, alt, className }: ProjectIconProps) => (
  <span
    className={cn(
      "block shrink-0 overflow-hidden rounded-xl border border-border bg-lavender",
      className,
    )}
  >
    {project.image && (
      <img src={project.image} alt={alt} loading="lazy" className="h-full w-full object-cover" />
    )}
  </span>
);

type ProjectDetailProps = {
  project: UiProject;
  subtitle?: string;
  position: number;
  count: number;
  labels: ProjectIndexLabels;
  onAsk: (question: string) => void;
  /** The heading is a title on the phone list and a panel heading in the index. */
  headingLevel: "h3" | "h4";
};

const ProjectDetail = ({
  project,
  subtitle,
  position,
  count,
  labels,
  onAsk,
  headingLevel: Heading,
}: ProjectDetailProps) => {
  const hasLinks = Boolean(project.github || project.demo);
  return (
    <article className="flex h-full flex-col gap-6">
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-5">
          <ProjectIcon
            project={project}
            alt={fill(labels.imageAlt, project.title)}
            className="h-14 w-14 md:h-[72px] md:w-[72px]"
          />
          <div>
            <Heading className="text-card-title-sm font-semibold md:text-card-title">
              {project.title}
            </Heading>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            {isThisSite(project) && (
              <p className="mt-1 font-mono text-meta text-iris">← {labels.youAreHere}</p>
            )}
          </div>
        </div>
        <p className="shrink-0 font-mono text-meta text-muted-foreground">
          {index(position)} / {index(count - 1)}
        </p>
      </header>

      <p className="max-w-[48ch] text-base text-muted-foreground md:text-body-lg">
        {project.description}
      </p>

      {project.technologies.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-meta uppercase tracking-widest text-muted-foreground">
            {labels.stack}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-foreground">
            {project.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {hasLinks ? (
          <>
            {project.demo && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${labels.demo} — ${project.title}`}
                >
                  <ExternalLink />
                  {labels.demo}
                </a>
              </Button>
            )}
            {project.github && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${labels.code} — ${project.title}`}
                >
                  <Github />
                  {labels.code}
                </a>
              </Button>
            )}
          </>
        ) : (
          <p className="font-mono text-meta text-muted-foreground">{labels.privateProject}</p>
        )}
        <Button
          variant="link"
          className="h-auto whitespace-normal text-left text-sm font-medium"
          onClick={() => onAsk(fill(labels.askVexQuestion, project.title))}
        >
          <MessageSquare />
          {fill(labels.askVex, project.title)}
        </Button>
      </div>
    </article>
  );
};

type ProjectIndexProps = {
  projects: readonly UiProject[];
  /** One descriptive line per title. A name like tURL says nothing until opened. */
  subtitles?: Record<string, string>;
  labels: ProjectIndexLabels;
  onAsk: (question: string) => void;
  className?: string;
};

const ProjectIndex = ({
  projects,
  subtitles = {},
  labels,
  onAsk,
  className,
}: ProjectIndexProps) => {
  const isMobile = useIsMobile();
  const [value, setValue] = useState(projects[0]?.title ?? "");
  const selected = projects.some((project) => project.title === value)
    ? value
    : (projects[0]?.title ?? "");

  if (projects.length === 0) return null;

  if (isMobile) {
    return (
      <ol className={cn("divide-y divide-border border-y border-border", className)}>
        {projects.map((project, position) => (
          <li key={project.title} className="py-8">
            <ProjectDetail
              project={project}
              subtitle={subtitles[project.title]}
              position={position}
              count={projects.length}
              labels={labels}
              onAsk={onAsk}
              headingLevel="h3"
            />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <TabsPrimitive.Root
      value={selected}
      onValueChange={setValue}
      orientation="vertical"
      activationMode="automatic"
      className={cn("grid grid-cols-12 gap-x-6", className)}
    >
      <TabsPrimitive.List
        aria-orientation="vertical"
        className="col-span-5 flex flex-col self-start border-t border-border"
      >
        {projects.map((project, position) => (
          <TabsPrimitive.Trigger
            key={project.title}
            value={project.title}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setValue(project.title);
            }}
            className="group flex items-baseline gap-4 border-b border-border py-4 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background md:py-5"
          >
            <span
              aria-hidden="true"
              className="block h-6 w-6 shrink-0 translate-y-1 rounded-motif border border-iris bg-lavender transition-colors duration-200 group-data-[state=active]:border-primary group-data-[state=active]:bg-primary"
            />
            <span className="w-7 shrink-0 font-mono text-meta text-muted-foreground">
              {index(position)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-card-title-sm font-semibold tracking-[-0.02em] text-muted-foreground transition-colors duration-200 group-hover:text-foreground group-data-[state=active]:text-foreground md:text-card-title">
                {project.title}
              </span>
              {subtitles[project.title] && (
                <span className="mt-1 block text-sm text-muted-foreground">
                  {subtitles[project.title]}
                </span>
              )}
              {isThisSite(project) && (
                <span className="mt-1 block font-mono text-meta text-iris">
                  ← {labels.youAreHere}
                </span>
              )}
            </span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {projects.map((project, position) => (
        <TabsPrimitive.Content
          key={project.title}
          value={project.title}
          className="col-span-7 self-start rounded-card border border-border bg-card p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background data-[state=active]:duration-400 data-[state=active]:ease-brand data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 motion-reduce:data-[state=active]:animate-none md:p-8 lg:col-span-7 lg:col-start-6"
        >
          <ProjectDetail
            project={project}
            position={position}
            count={projects.length}
            labels={labels}
            onAsk={onAsk}
            headingLevel="h3"
          />
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
};

export default ProjectIndex;
