import { useRef, useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { CodeXml, ExternalLink, Lock } from "lucide-react";

import AskVexPrompt from "@/components/AskVexPrompt";
import BuildLine from "@/components/home/BuildLine";
import LiveCheck, { type LiveCheckLabels } from "@/components/home/LiveCheck";
import ProjectField, { type ProjectFieldLabels } from "@/components/home/ProjectField";
import ProjectWindow from "@/components/home/ProjectWindow";
import { projectIcons } from "@/config/projectIcons";
import { useOnceInView } from "@/hooks/use-in-view";
import type { LiveChecks } from "@/hooks/use-live-checks";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { type CheckState, hostOf } from "@/lib/liveCheck";
import { isThisSite } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * The projects as pucks on a heat field (see ProjectField) over one panel per
 * project. Choosing a puck, by a click or with Enter, opens its panel; the
 * first time the section is mostly in view every address is checked once, in
 * turn; the sentence under the heading (see CheckProof) and each frame's
 * address bar show the answers.
 *
 * Under it, the chosen project's panel: a browser frame, as the kit's project
 * card (white, a 20px radius, a subtle outline), whose address bar is the live
 * check (see LiveCheck), with the way to the code beside it, and whose window
 * paints the real page in when the check comes back (see ProjectWindow);
 * beside it what the project is, its stack and a way to ask Vex, so what it is and what it looks
 * like are read together. All panels share one cell, so choosing another
 * never moves the page. The panel enters with the kit's 8px rise.
 *
 * One of the projects is this site: its bar says so instead of checking it.
 * On a phone the description follows the frame.
 */

export type ProjectIndexLabels = {
  /** Text of the link to a public repository. */
  code: string;
  /** Its accessible name, saying where it leads. */
  codeOnGithub: string;
  /** Said plainly where the repository is not public. */
  codePrivate: string;
  /** Accessible name of the stack. */
  stack: string;
  /** The cycling stack's pause control, in each state. */
  stackNext: string;
  /** Note beside the project that is this site. */
  youAreHere: string;
  /** In the address bar of a project with no public address yet. */
  notPublic: string;
  /** What the ask-Vex control does, read after its name; `{title}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{title}` is replaced. */
  askVexQuestion: string;
  /** Alt text of a screenshot; `{title}` is replaced. */
  screenshotAlt: string;
  field: ProjectFieldLabels;
  live: LiveCheckLabels;
};

/** Decorative: the name stands beside it, so the icon says nothing more. */
const ProjectIcon = ({ project, className }: { project: UiProject; className?: string }) => {
  // The site's own copy of the project's icon first, then the backend's image.
  const icon = projectIcons[project.title] ?? project.image;
  return (
    <span
      className={cn(
        "block shrink-0 overflow-hidden rounded-xl border border-border bg-lavender",
        className,
      )}
    >
      {icon ? (
        <img src={icon} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        // Until a project has an icon, its initial, drawn to scale at any size.
        <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
          <text
            x="50"
            y="50"
            dy="0.35em"
            textAnchor="middle"
            fontSize="52"
            fontWeight="600"
            className="fill-iris"
          >
            {project.title.charAt(0)}
          </text>
        </svg>
      )}
    </span>
  );
};

/**
 * The way to the code: a control when the repository is public, a plain note
 * when it is not. Where the bar is narrow (a phone, and lg to xl where the
 * frame is half the row) it is the icon alone, so the bar stays one row; the
 * words stay for assistive technology.
 */
const CodeDoor = ({ github, labels }: { github: string; labels: ProjectIndexLabels }) =>
  github ? (
    <a
      href={github}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={labels.codeOnGithub}
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-control-border bg-card font-mono text-meta text-foreground outline-none transition-colors duration-200 hover:border-iris focus-visible:ring-2 focus-visible:ring-ring sm:max-lg:px-4 xl:px-4"
    >
      <CodeXml aria-hidden="true" className="size-4 text-iris" />
      <span aria-hidden="true" className="contents max-sm:hidden lg:max-xl:hidden">
        {labels.code}
        <ExternalLink className="size-3.5 text-muted-foreground" />
      </span>
    </a>
  ) : (
    <span className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 px-2 font-mono text-meta text-muted-foreground">
      <Lock aria-hidden="true" className="size-3.5" />
      <span className="max-sm:sr-only lg:max-xl:sr-only">{labels.codePrivate}</span>
    </span>
  );

/** What Dawid did on a project, and when. */
export type ProjectFacts = { role: string };

type ProjectFrameProps = {
  project: UiProject;
  subtitle?: string;
  facts?: ProjectFacts;
  screenshot?: string;
  labels: ProjectIndexLabels;
  onAsk: (question: string) => void;
  checkState: CheckState;
  onCheck: () => void;
  /** Whether this is the open project; only its stack cycles. */
  active: boolean;
};

const ProjectFrame = ({
  project,
  subtitle,
  facts,
  screenshot,
  labels,
  onAsk,
  checkState,
  onCheck,
  active,
}: ProjectFrameProps) => {
  const self = isThisSite(project);
  return (
    <article className="grid gap-6 lg:grid-cols-12 lg:gap-x-6">
      <div className="self-start overflow-hidden rounded-card border border-border bg-card lg:col-span-6 xl:col-span-7">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background px-3 py-2.5 sm:px-4">
          <span aria-hidden="true" className="hidden gap-1.5 sm:max-lg:flex xl:flex">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="size-2.5 rounded-full border border-border bg-card" />
            ))}
          </span>
          {project.demo && !self ? (
            <LiveCheck
              url={project.demo}
              state={checkState}
              onCheck={onCheck}
              labels={labels.live}
            />
          ) : (
            <p className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-card px-4 font-mono text-meta">
              {project.demo || project.github ? (
                <span className="text-foreground">{hostOf(project.demo || project.github)}</span>
              ) : (
                <span className="text-muted-foreground">{labels.notPublic}</span>
              )}
              {/* Left out on the narrowest phones, where it would push the bar onto
                  a second row; the frame shows this very page anyway. */}
              {self && (
                <span className="ml-auto text-iris max-[379px]:hidden">← {labels.youAreHere}</span>
              )}
            </p>
          )}
          {/* Where it runs and where its code is, side by side: two doors in
              one bar, always one row (see CodeDoor). */}
          <CodeDoor github={project.github} labels={labels} />
        </div>

        <ProjectWindow
          screenshot={screenshot}
          alt={fillTemplate(labels.screenshotAlt, { title: project.title })}
          icon={<ProjectIcon project={project} className="size-16 rounded-card md:size-20" />}
          subtitle={subtitle}
          checkState={checkState}
          always={self}
        />
      </div>

      {/* What the project is, beside what it looks like, so both are read
          at once. */}
      {/* Six and six below xl: at 1024 a five-column story ran up to 95px
          past the frame. */}
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-6 xl:col-span-5">
        <header>
          <h3 className="text-h2-sm font-semibold">{project.title}</h3>
          {/* Without a screenshot the band above already carries this line. */}
          {screenshot && subtitle && (
            <p className="mt-1 text-base font-medium text-iris">{subtitle}</p>
          )}
          {/* The role: what Dawid did, then when. */}
          {facts && <p className="mt-2 font-mono text-meta text-muted-foreground">{facts.role}</p>}
        </header>

        {/* Never clamped: the summary is written to be read whole. */}
        <p className="text-base text-muted-foreground md:text-body-lg">{project.description}</p>

        <BuildLine
          technologies={project.technologies}
          active={active}
          label={labels.stack}
          nextLabel={labels.stackNext}
        />

        {/* Pinned to the column's foot, so it ends level with the frame
            beside it when the text is shorter. On a phone it makes room for
            the chat button, so the question wraps rather than losing the
            project's name. */}
        <AskVexPrompt
          question={
            project.vexQuestion || fillTemplate(labels.askVexQuestion, { title: project.title })
          }
          hint={fillTemplate(labels.askVex, { title: project.title })}
          onAsk={onAsk}
          className="max-sm:w-[calc(100%-4rem)] sm:w-fit sm:self-center lg:mt-auto"
        />
      </div>
    </article>
  );
};

type ProjectIndexProps = {
  projects: readonly UiProject[];
  /** One descriptive line per title. A name like tURL says nothing until opened. */
  subtitles?: Record<string, string>;
  /** The role line per title. */
  facts?: Record<string, ProjectFacts>;
  /** A real screenshot per title, for the page's language (see config/projectScreenshots). */
  screenshots?: Readonly<Record<string, string>>;
  labels: ProjectIndexLabels;
  onAsk: (question: string) => void;
  /** The live checks of the projects' addresses, shared with the page. */
  checks: LiveChecks;
  /** Starts the checks; the page owns which addresses are checked. */
  onSeen: () => void;
  className?: string;
};

const ProjectIndex = ({
  projects,
  subtitles = {},
  facts = {},
  screenshots = {},
  labels,
  onAsk,
  checks,
  onSeen,
  className,
}: ProjectIndexProps) => {
  const [value, setValue] = useState(projects[0]?.title ?? "");
  const selected = projects.some((project) => project.title === value)
    ? value
    : (projects[0]?.title ?? "");

  const { stateOf, check } = checks;

  // Every address is checked once, in turn, the first time the section is
  // mostly in view (or its sentence under the heading is; see the page), so
  // the answers are there without a press and the open frame's page paints
  // in as its answer arrives.
  const root = useRef<HTMLDivElement>(null);
  useOnceInView(root, onSeen, { threshold: 0.3 });

  // Opening a project from the field brings its panel into view when it
  // starts below the fold, so a choice is never answered off screen.
  const prefersReducedMotion = usePrefersReducedMotion();
  const panels = useRef<HTMLDivElement>(null);
  // Idempotent: Enter on a puck opens it through the tabs and again through
  // the click the browser sends after it, and assistive technology opens it
  // with a click alone; whichever comes first opens it, once.
  const opened = useRef(selected);
  opened.current = selected;
  const open = (title: string) => {
    if (title === opened.current) return;
    opened.current = title;
    setValue(title);
    const panel = panels.current;
    if (panel && panel.getBoundingClientRect().top > window.innerHeight * 0.85) {
      panel.scrollIntoView({ block: "start", behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  if (projects.length === 0) return null;

  return (
    <TabsPrimitive.Root
      ref={root}
      value={selected}
      onValueChange={open}
      // Focus only moves between pucks; Enter or a click opens one.
      activationMode="manual"
      className={cn("flex flex-col gap-6", className)}
    >
      <ProjectField
        projects={projects}
        subtitles={subtitles}
        selected={selected}
        onOpen={open}
        labels={labels.field}
      />

      {/* Every project's panel is kept in one cell, the hidden ones invisible
          rather than removed, so the cell is as tall as the tallest and
          choosing another project never moves the page. */}
      <div ref={panels} className="grid scroll-mt-28">
        {projects.map((project) => (
          <TabsPrimitive.Content
            key={project.title}
            value={project.title}
            forceMount
            className="rounded-card outline-none [grid-area:1/1] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background data-[state=inactive]:invisible data-[state=active]:duration-400 data-[state=active]:ease-brand data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 motion-reduce:data-[state=active]:animate-none"
          >
            <ProjectFrame
              project={project}
              subtitle={subtitles[project.title]}
              facts={facts[project.title]}
              screenshot={screenshots[project.title]}
              labels={labels}
              onAsk={onAsk}
              checkState={project.demo ? stateOf(project.demo) : { phase: "idle" }}
              onCheck={() => void check(project.demo)}
              active={project.title === selected}
            />
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  );
};

export default ProjectIndex;
