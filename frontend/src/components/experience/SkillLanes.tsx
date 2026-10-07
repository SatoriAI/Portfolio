import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";

import { TimelineAxis, TimelineGridlines } from "@/components/experience/TimelineAxis";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { prefersReducedMotion } from "@/lib/media";
import { EASE_BRAND } from "@/lib/motion";
import type { LaneSegment } from "@/lib/skillLanes";
import type { UiSkill } from "@/lib/skillsService";
import { parseYears } from "@/lib/skillYears";
import type { TimelineTick } from "@/lib/timeline";
import { cn } from "@/lib/utils";

/**
 * The skills told as the path of one request, layer by layer, as a chart to
 * scan: one thin row per skill, its bar on the same time axis as the career
 * timeline above, month for month.
 *
 * A bar is drawn only where a role proves the skill: the months of every role
 * whose technologies name it, merged where roles overlap, gaps kept, and a
 * navy dot where it is still running. Where the claimed level reaches back
 * further than the roles show, the row says "earlier" instead of drawing
 * years no role backs. A skill no role places in time says so in place of a
 * bar.
 *
 * The detail is the answer to a choice, so nothing is chosen at first. Under
 * the chart, one panel shows the chosen skill: one line of proof, the roles
 * as logos, and the projects whose tags name it. On a phone it
 * opens under the chosen row instead. Choosing a skill also lights its roles
 * up on the timeline (the page draws that); pointing at a role on the
 * timeline draws a band through the rows over its months, growing from its
 * start, and the skills it did not use recede.
 *
 * When the section comes into view the request travels once: layer by layer,
 * the name lights up and its bars draw from their first month to their last.
 * It never plays again, and with reduced motion everything is simply shown.
 */

export type SkillLane = {
  segments: readonly LaneSegment[];
  /** The roles that prove the skill: a small mark each, and the name read out. */
  roles: readonly { id: number; name: string; mark: ReactNode }[];
  /** Projects whose tags name the skill. */
  projects: readonly string[];
  earlier: boolean;
};

type SkillLanesLabels = {
  years: (count: number) => string;
  level: (level: string) => string;
  show: (name: string) => string;
  outsideRoles: string;
  earlier: string;
  roles: string;
  projects: string;
  /** "+2 more", given how many. */
  more: (count: number) => string;
};

type SkillLanesProps = {
  skills: readonly UiSkill[];
  /** The axis of the career timeline, so both line up month for month. */
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

/** One skill's proof: the line, the roles, the projects. */
const Detail = ({ skill, lane, labels }: DetailProps) => {
  const Icon = skill.icon;
  const projects = lane?.projects ?? [];
  const roles = lane?.roles ?? [];
  return (
    <div className="duration-400 ease-brand animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none">
      <h3 className="flex items-center gap-2 text-card-title-sm font-semibold">
        <span aria-hidden="true" className="text-iris">
          <Icon className="size-5" />
        </span>
        {skill.name}
      </h3>
      {skill.description && (
        <p className="mt-2 max-w-[60ch] text-base text-muted-foreground">{skill.description}</p>
      )}
      {(roles.length > 0 || projects.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-meta">
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

  const detailed = selectedId === null ? undefined : byId.get(selectedId);

  // A skill chosen high in the chart opens its detail a screen below: bring
  // the panel into view, at once rather than gliding, since only the scroll
  // itself may move the page. Not on a phone, where the panel is hidden and
  // the detail opens under the row.
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedId === null || !panel.current?.offsetParent) return;
    panel.current.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selectedId]);

  return (
    <div ref={revealRef} className={cn("relative", className)}>
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
                const years = parseYears(skill.level);
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
                        {lane?.earlier && (
                          <span
                            className="whitespace-nowrap font-mono text-meta text-muted-foreground"
                            style={{
                              opacity: shown ? 1 : 0,
                              transition: transition("opacity", 200, layer, DRAW_MS),
                            }}
                          >
                            ← {labels.earlier}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 font-mono text-meta transition-colors duration-200 ${
                          receded ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {years !== null ? labels.years(years) : labels.level(skill.level)}
                      </span>
                    </div>

                    {/* The bar: the months a role proves, on the timeline's axis. */}
                    <div
                      className={cn(
                        "relative mt-1.5 h-1.5 transition-opacity duration-200",
                        // The words "outside the roles" stay, like the name.
                        receded && segments.length > 0 && "opacity-40",
                      )}
                    >
                      {segments.length > 0 ? (
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

                    {/* On a phone the proof opens here, not a screen away. */}
                    {selected && (
                      <div className="mt-4 pb-2 md:hidden">
                        <Detail skill={skill} lane={lane} labels={labels} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* From md, the chosen skill's proof, in one panel under the chart. */}
      {detailed && (
        <div
          ref={panel}
          aria-live="polite"
          className="mt-6 hidden min-h-[8rem] rounded-card border border-border bg-card p-5 md:block"
        >
          <Detail
            key={detailed.id}
            skill={detailed}
            lane={lanes.get(detailed.id)}
            labels={labels}
          />
        </div>
      )}
    </div>
  );
};

export default SkillLanes;
