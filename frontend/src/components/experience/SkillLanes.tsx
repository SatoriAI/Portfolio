import { type ReactNode, useLayoutEffect, useRef } from "react";

import { TimelineAxis, TimelineGridlines } from "@/components/experience/TimelineAxis";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { prefersReducedMotion } from "@/lib/media";
import { EASE_BRAND } from "@/lib/motion";
import type { LaneSegment, SkillReach } from "@/lib/skillLanes";
import type { UiSkill } from "@/lib/skillsService";
import type { TimelineTick } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * The skills, group by group (config/skillLayers), as a chart to scan: one
 * thin row per skill, its bar on the career timeline's time axis, reaching
 * further back where a skill was used before its roles.
 *
 * The bar is solid where a role proves the skill: the months of every role
 * whose technologies name it, merged where roles overlap, gaps kept, and a
 * navy dot where it is still running. Before the first role, the years it
 * was used anyway (university, own projects) are dashed, from its start
 * year; one used from before the axis begins says from when. The count at
 * the row's end is the whole bar, dashed and solid, so the two never
 * disagree; a tool used since it came out says so instead. A skill nothing
 * places in time says so in place of a bar.
 *
 * The detail is the answer to a choice, so nothing is chosen at first. It
 * opens in place, under the chosen row, as a lavender band: the skill's
 * line of proof, the roles as logos and the projects whose tags name it,
 * without repeating the name the row already gives. Nothing else on the
 * page moves to show it. Choosing a skill also lights its roles
 * up on the timeline (the page draws that); pointing at a role on the
 * timeline draws a band through the rows over its months, growing from its
 * start, and the skills it did not use recede.
 *
 * When the section comes into view the chart draws once, group by group:
 * each name lights up and its bars draw from their first month to their last.
 * It never plays again, and with reduced motion everything is simply shown.
 */

export type SkillLane = {
  segments: readonly LaneSegment[];
  /** The roles that prove the skill: a small mark each, and the name read out. */
  roles: readonly { id: number; name: string; mark: ReactNode }[];
  /** Projects whose tags name the skill. */
  projects: readonly string[];
} & SkillReach;

type SkillLanesLabels = {
  years: (count: number) => string;
  /** Beside a skill used from before the axis, given the year. */
  since: (year: number) => string;
  sinceLaunch: string;
  show: (name: string) => string;
  outsideRoles: string;
  /** The legend: what the solid and the dashed bar stand for. */
  legend: { roles: string; own: string };
  roles: string;
  projects: string;
  /** "+2 more", given how many. */
  more: (count: number) => string;
};

type SkillLanesProps = {
  skills: readonly UiSkill[];
  /** The career timeline's axis, reaching back as far as the skills do. */
  axis: { months: number; ticks: readonly TimelineTick[] };
  lanes: ReadonlyMap<number, SkillLane>;
  /** The layers, in order, each with its name and its skills' ids. */
  layers: readonly { key: string; label: string; skills: readonly number[] }[];
  labels: SkillLanesLabels;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  /** The role being pointed at on the timeline, drawn as a band. */
  band: { id: number; startMonth: number; endMonth: number } | null;
  className?: string;
};

/** The years used outside any role, dashed in the bar's own colour. */
const DASHED = "bg-[repeating-linear-gradient(90deg,currentColor_0_6px,transparent_6px_10px)]";

/** The two kinds of bar, each with a short piece of itself, so a reader knows the dashes at once. */
const Legend = ({ labels }: { labels: SkillLanesLabels["legend"] }) => (
  <ul className="mb-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-meta text-muted-foreground">
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className="h-1.5 w-6 rounded-motif bg-iris/50" />
      {labels.roles}
    </li>
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={cn("h-1.5 w-6 text-iris/50", DASHED)} />
      {labels.own}
    </li>
  </ul>
);

/** How long the request takes from one layer to the next. */
const LAYER_STEP_MS = 220;
/** How long a bar takes to draw, as the timeline's own line does. */
const DRAW_MS = 500;
/** Projects named in the detail before the rest are counted. */
const PROJECTS_SHOWN = 3;

/** The band over the months of the role pointed at, grown from its start. */
const Band = ({ left, width }: { left: string; width: string }) => {
  const band = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    band.current?.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: 200,
      easing: EASE_BRAND,
    });
  }, []);
  return (
    <span
      ref={band}
      className="absolute inset-y-0 origin-left bg-iris/10"
      style={{ left, width }}
    />
  );
};

type DetailProps = {
  skill: UiSkill;
  lane: SkillLane | undefined;
  labels: SkillLanesLabels;
};

/**
 * One skill's proof, under its row: the line on the left, the roles and the
 * projects on the right, wrapping under it where the row is narrow. Above the
 * button laid over the row, so reading it does not close it; opaque, so the
 * gridlines stop at it.
 */
const Detail = ({ skill, lane, labels }: DetailProps) => {
  const projects = lane?.projects ?? [];
  const roles = lane?.roles ?? [];
  if (!skill.description && roles.length === 0 && projects.length === 0) return null;
  return (
    <div className="relative z-20 mt-2 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 rounded-lg bg-background px-4 py-3 shadow-[inset_0_0_0_999px_hsl(var(--lavender)/0.45)] duration-400 ease-brand animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none">
      {skill.description && <p className="text-base text-foreground">{skill.description}</p>}
      {(roles.length > 0 || projects.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-meta">
          {roles.length > 0 && (
            <span className="flex items-center gap-3">
              <span className="uppercase tracking-widest text-muted-foreground">
                {labels.roles}
              </span>
              <span className="flex -space-x-1.5">{roles.map((role) => role.mark)}</span>
              <span className="sr-only">{roles.map((role) => role.name).join(", ")}</span>
            </span>
          )}
          {projects.length > 0 && (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="uppercase tracking-widest text-muted-foreground">
                {labels.projects}
              </span>
              <span className="text-foreground">
                {projects.slice(0, PROJECTS_SHOWN).join(", ")}
                {projects.length > PROJECTS_SHOWN &&
                  ` ${labels.more(projects.length - PROJECTS_SHOWN)}`}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const SkillLanes = ({
  skills,
  axis,
  lanes,
  layers,
  labels,
  selectedId,
  onSelect,
  band,
  className,
}: SkillLanesProps) => {
  const percent = (month: number) => `${(month / axis.months) * 100}%`;
  const { ref: revealRef, isRevealed, prefersReducedMotion } = useScrollReveal<HTMLDivElement>();

  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const placed = new Set(layers.flatMap((layer) => layer.skills));
  const groups = [
    ...layers.map((layer) => ({
      ...layer,
      items: layer.skills.flatMap((id) => byId.get(id) ?? []),
    })),
    // Skills the layers do not name yet, after them all.
    { key: "other", label: "", items: skills.filter((skill) => !placed.has(skill.id)) },
  ].filter((group) => group.items.length > 0);

  // The whole chart fits a screen, so the request sets off down the layers
  // once, as it comes into view.
  const shown = isRevealed;
  // Each layer waits for the one above it.
  const transition = (property: string, duration: number, layer: number, after = 0) =>
    prefersReducedMotion
      ? "none"
      : `${property} ${duration}ms ${EASE_BRAND} ${layer * LAYER_STEP_MS + after}ms`;

  return (
    <div ref={revealRef} className={cn("relative", className)}>
      {/* What the two kinds of bar mean, read before the bars. */}
      <Legend labels={labels.legend} />
      {/* The axis, as on the timeline above. */}
      <TimelineAxis ticks={axis.ticks} months={axis.months} />

      <div className="relative">
        {/* Gridlines through every row, and the band of the role pointed at. */}
        <TimelineGridlines ticks={axis.ticks} months={axis.months} className="inset-0">
          {band && (
            <Band
              key={band.id}
              left={percent(band.startMonth)}
              width={percent(band.endMonth - band.startMonth)}
            />
          )}
        </TimelineGridlines>

        {groups.map((group, layer) => (
          <section key={group.key} aria-label={group.label || undefined} className="relative pt-3">
            {group.label ? (
              <h3
                className="font-mono text-meta uppercase tracking-widest text-iris"
                style={{
                  opacity: shown ? 1 : 0.35,
                  transition: transition("opacity", 200, layer),
                }}
              >
                {group.label}
              </h3>
            ) : null}
            <ol>
              {group.items.map((skill) => {
                const lane = lanes.get(skill.id);
                const segments = lane?.segments ?? [];
                const selected = skill.id === selectedId;
                const receded = band !== null && !lane?.roles.some((role) => role.id === band.id);
                const years = lane?.years ?? null;
                const Icon = skill.icon;
                // A skill the chosen role did not use greys its words, which
                // stay legible, and fades only its bar.
                const tone = selected
                  ? "text-iris"
                  : receded
                    ? "text-muted-foreground group-hover:text-iris"
                    : "text-foreground group-hover:text-iris";
                return (
                  <li key={skill.id} className="group relative border-b border-border/60 py-1.5">
                    {/* The whole row presses, through a button laid over it. */}
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={labels.show(skill.name)}
                      onClick={() => onSelect(selected ? null : skill.id)}
                      className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />

                    <div className="flex items-center justify-between gap-4">
                      <span className="flex min-w-0 items-center gap-2">
                        {/* A brand mark keeps its colour; beside a greyed
                            name it fades with the bar instead. */}
                        <span
                          aria-hidden="true"
                          className={`transition-[color,opacity] duration-200 ${tone} ${receded ? "opacity-50" : ""}`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <h4
                          className={cn(
                            "truncate text-sm font-medium transition-colors duration-200",
                            tone,
                          )}
                        >
                          {skill.name}
                        </h4>
                        {lane?.beforeAxis && skill.since !== null && (
                          <span
                            className="whitespace-nowrap font-mono text-meta text-muted-foreground"
                            style={{
                              opacity: shown ? 1 : 0,
                              transition: transition("opacity", 200, layer, DRAW_MS),
                            }}
                          >
                            ← {labels.since(skill.since)}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 font-mono text-meta transition-colors duration-200 ${
                          receded ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {skill.sinceLaunch
                          ? labels.sinceLaunch
                          : years !== null && labels.years(years)}
                      </span>
                    </div>

                    {/* The bar: the months a role proves, on the timeline's axis. */}
                    <div
                      className={cn(
                        "relative mt-1.5 h-1.5 transition-opacity duration-200",
                        // The words "outside the roles" stay, like the name.
                        receded && (segments.length > 0 || lane?.leadIn) && "opacity-40",
                      )}
                    >
                      {/* The years used before the roles: the bar's own
                          colour, dashed, drawn with the rest. */}
                      {lane?.leadIn && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 origin-left"
                          style={{
                            left: percent(lane.leadIn.startMonth),
                            width: percent(lane.leadIn.endMonth - lane.leadIn.startMonth),
                            transform: `scaleX(${shown ? 1 : 0})`,
                            transition: transition("transform", DRAW_MS, layer),
                          }}
                        >
                          <span
                            className={cn(
                              "block h-full transition-[color,transform] duration-200 group-hover:scale-y-150",
                              DASHED,
                              selected ? "text-iris" : "text-iris/50",
                            )}
                          />
                        </span>
                      )}
                      {segments.length > 0 || lane?.leadIn ? (
                        segments.map((segment) => (
                          <span key={segment.startMonth} aria-hidden="true">
                            {/* Drawn from its first month as its layer is
                                reached; the bar inside thickens under the
                                pointer, so the two motions never share one
                                transform. */}
                            <span
                              className="absolute inset-y-0 origin-left"
                              style={{
                                left: percent(segment.startMonth),
                                width: percent(segment.endMonth - segment.startMonth),
                                transform: `scaleX(${shown ? 1 : 0})`,
                                transition: transition("transform", DRAW_MS, layer),
                              }}
                            >
                              <span
                                className={cn(
                                  "block h-full rounded-motif transition-[background-color,transform] duration-200 group-hover:scale-y-150",
                                  selected ? "bg-iris" : "bg-iris/50",
                                )}
                              />
                            </span>
                            {/* Outside the bar, so the draw does not squash it. */}
                            {segment.current && (
                              <span
                                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                                style={{
                                  left: percent(segment.endMonth),
                                  opacity: shown ? 1 : 0,
                                  transition: transition("opacity", 200, layer, DRAW_MS),
                                }}
                              />
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="absolute -top-1 font-mono text-meta leading-none text-muted-foreground">
                          {labels.outsideRoles}
                        </span>
                      )}
                    </div>

                    {/* The proof opens here, under the row that asked for it. */}
                    {selected && <Detail skill={skill} lane={lane} labels={labels} />}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
};

export default SkillLanes;
