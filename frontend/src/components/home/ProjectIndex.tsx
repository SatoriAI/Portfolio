import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ArrowUp, ChevronLeft, ChevronRight, CodeXml, ExternalLink, Lock } from "lucide-react";

import BuildLine from "@/components/home/BuildLine";
import LiveCheck, { type CheckState, type LiveCheckLabels } from "@/components/home/LiveCheck";
import ProjectWindow from "@/components/home/ProjectWindow";
import { Button } from "@/components/ui/button";
import { projectIcons } from "@/config/projectIcons";
import type { LiveChecks } from "@/hooks/use-live-checks";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { hostOf } from "@/lib/liveCheck";
import { isThisSite } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

/**
 * The projects as a strip of tabs over one panel per project.
 *
 * The strip runs the full width: each tab its icon and its name. The chosen
 * one sits in a pressed well that slides along the strip to the next one
 * chosen. Tabs choose on press or keyboard focus, never on hover. The first
 * time the section is mostly in view every address is checked once, in turn;
 * the sentence under the heading (see CheckProof) and each frame's address
 * bar show the answers.
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
 * On a phone the strip scrolls sideways and the description follows the
 * frame.
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
  /** Text of the ask-Vex control; `{title}` is replaced. */
  askVex: string;
  /** The question sent when it is pressed; `{title}` is replaced. */
  askVexQuestion: string;
  /** The language's quotation marks around `{text}`, for the question shown. */
  quoted: string;
  /** Alt text of a screenshot; `{title}` is replaced. */
  screenshotAlt: string;
  /** Accessible names of the arrows beside the strip. */
  previous: string;
  next: string;
  live: LiveCheckLabels;
};

const fill = (template: string, title: string) => template.replace("{title}", title);

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
          alt={fill(labels.screenshotAlt, project.title)}
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

        {/* Asking Vex looks like what it is: the chat's own input, already
            holding the question it will send. Pinned to the column's foot, so
            it ends level with the frame beside it when the text is shorter. */}
        <button
          type="button"
          aria-label={fill(labels.askVex, project.title)}
          onClick={() => onAsk(fill(labels.askVexQuestion, project.title))}
          className="group flex min-h-11 w-full items-center gap-3 rounded-lg border border-control-border bg-background py-1.5 pl-4 pr-1.5 text-left outline-none transition-colors duration-200 hover:border-iris focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background max-sm:w-[calc(100%-4rem)] sm:w-fit sm:self-center lg:mt-auto"
        >
          <span className="shrink-0 font-mono text-meta text-iris">Vex</span>
          {/* On a phone the pill makes room for the chat button, so the
              question wraps rather than losing the project's name. */}
          <span className="min-w-0 flex-1 text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground sm:truncate">
            {labels.quoted.replace("{text}", fill(labels.askVexQuestion, project.title))}
          </span>
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            <ArrowUp className="size-4" />
          </span>
        </button>
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
  className,
}: ProjectIndexProps) => {
  const [value, setValue] = useState(projects[0]?.title ?? "");
  const selected = projects.some((project) => project.title === value)
    ? value
    : (projects[0]?.title ?? "");

  const { stateOf, check, checkAllOnce } = checks;
  const checkable = useMemo(
    () => projects.filter((project) => project.demo && !isThisSite(project)),
    [projects],
  );

  // Every address is checked once, in turn, the first time the section is
  // mostly in view (or its sentence under the heading is; see the page), so
  // the answers are there without a press and the open frame's page paints
  // in as its answer arrives.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        checkAllOnce(checkable.map((project) => project.demo));
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [checkAllOnce, checkable]);

  // The pressed well: one shape laid under the strip that slides to the
  // chosen tab. It lives inside the strip, so when the strip scrolls on a
  // narrow screen the well scrolls with it. Placed before paint, and again
  // when the tabs reflow.
  const list = useRef<HTMLDivElement>(null);
  const [well, setWell] = useState<{ left: number; width: number; moved: boolean } | null>(null);
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const place = () => {
      const tab = element.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (!tab) return;
      setWell((last) => ({ left: tab.offsetLeft, width: tab.offsetWidth, moved: last !== null }));
    };
    place();
    // The tabs, not only the strip: a time arriving widens its tab while the
    // strip keeps its size.
    const observer = new ResizeObserver(place);
    observer.observe(element);
    element.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [selected]);

  // The arrows page the strip like a carousel, about one view at a time,
  // and the reader chooses a project by pressing its tab. Each arrow is live
  // only while there are more tabs on its side, and a soft fade marks that
  // side. A chosen tab is scrolled just enough to be in full view.
  const prefersReducedMotion = usePrefersReducedMotion();
  const [edges, setEdges] = useState({ before: false, after: false });
  const reveal = useCallback((smooth: boolean) => {
    const element = list.current;
    const tab = element?.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
    if (!element || !tab) return;
    const margin = 24;
    const left = Math.max(0, tab.offsetLeft - margin);
    const right = tab.offsetLeft + tab.offsetWidth + margin - element.clientWidth;
    const target =
      element.scrollLeft > left ? left : element.scrollLeft < right ? right : element.scrollLeft;
    if (target !== element.scrollLeft) {
      element.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
    }
  }, []);
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () =>
      setEdges({
        before: element.scrollLeft > 1,
        after: element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
      });
    // A resize can push the chosen tab out of view; bring it back at once.
    const resized = () => {
      reveal(false);
      measure();
    };
    resized();
    element.addEventListener("scroll", measure, { passive: true });
    // The tabs too: a time arriving widens its tab, and with it the row,
    // while the strip keeps its size.
    const observer = new ResizeObserver(resized);
    observer.observe(element);
    element.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => {
      element.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [reveal]);
  useEffect(() => reveal(!prefersReducedMotion), [selected, prefersReducedMotion, reveal]);
  // A page is whole tabs: forward, the first tab cut off at the right edge
  // comes to the start; back, the last one hidden on the left comes fully
  // in at the end. No page lands with a tab half shown.
  const page = (direction: -1 | 1) => {
    const element = list.current;
    if (!element) return;
    const tabs = [...element.querySelectorAll<HTMLElement>('[role="tab"]')];
    const start = element.scrollLeft;
    const end = start + element.clientWidth;
    let target: number | undefined;
    if (direction === 1) {
      const cut = tabs.find((tab) => tab.offsetLeft + tab.offsetWidth > end + 1);
      target = cut?.offsetLeft;
    } else {
      const hidden = tabs.filter((tab) => tab.offsetLeft < start - 1).pop();
      if (hidden)
        target = Math.max(0, hidden.offsetLeft + hidden.offsetWidth - element.clientWidth);
    }
    if (target === undefined) return;
    element.scrollTo({ left: target, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  if (projects.length === 0) return null;

  return (
    <TabsPrimitive.Root
      ref={root}
      value={selected}
      onValueChange={setValue}
      className={cn("flex flex-col gap-6", className)}
    >
      {/* Each tab is as wide as its content and grows to fill the row;
          where the row is too narrow for all of them, it scrolls sideways
          rather than cut a name short. From sm up, the arrows at its ends page it; on a phone it swipes. */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden shrink-0 sm:inline-flex"
          aria-label={labels.previous}
          disabled={!edges.before}
          onClick={() => page(-1)}
        >
          <ChevronLeft />
        </Button>
        <TabsPrimitive.List
          ref={list}
          style={{
            maskImage: `linear-gradient(to right, ${edges.before ? "transparent" : "black"}, black 32px, black calc(100% - 32px), ${edges.after ? "transparent" : "black"})`,
          }}
          className="relative -mx-6 flex min-w-0 flex-1 gap-1 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
        >
          {well && (
            <span
              aria-hidden="true"
              style={{ translate: `${well.left}px 0`, width: well.width }}
              className={cn(
                "pointer-events-none absolute bottom-1 left-0 top-0 rounded-xl border border-control-border bg-background shadow-press",
                well.moved &&
                  "transition-[translate,width] duration-300 ease-brand motion-reduce:transition-none",
              )}
            />
          )}
          {projects.map((project) => (
            <TabsPrimitive.Trigger
              key={project.title}
              value={project.title}
              className="group relative flex min-h-11 shrink-0 grow basis-auto items-center gap-2 rounded-xl px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background lg:min-h-16"
            >
              <ProjectIcon project={project} className="size-8 rounded-lg" />
              <span className="whitespace-nowrap text-base font-semibold tracking-[-0.02em] text-muted-foreground transition-colors duration-200 group-hover:text-foreground group-data-[state=active]:text-foreground">
                {project.title}
              </span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        <Button
          variant="outline"
          size="icon"
          className="hidden shrink-0 sm:inline-flex"
          aria-label={labels.next}
          disabled={!edges.after}
          onClick={() => page(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Every project's panel is kept in one cell, the hidden ones invisible
          rather than removed, so the cell is as tall as the tallest and
          choosing another project never moves the page. */}
      <div className="grid">
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
