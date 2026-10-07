import { useMemo, useRef, useState } from "react";

import HeaderShapes from "@/components/brand/HeaderShapes";
import HeatField from "@/components/brand/HeatField";
import CareerTimeline, { type TimelineEntry } from "@/components/experience/CareerTimeline";
import CircleFlight, { type FlightPhase } from "@/components/experience/CircleFlight";
import { circleState } from "@/components/experience/circleStyles";
import CompanyMark from "@/components/experience/CompanyMark";
import RoleEntry from "@/components/experience/RoleEntry";
import RoleSidebar from "@/components/experience/RoleSidebar";
import SkillLanes, { type SkillLane } from "@/components/experience/SkillLanes";
import TimelineDialog from "@/components/experience/TimelineDialog";
import { queryStatus } from "@/components/feedback/queryStatus";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageClosing from "@/components/layout/PageClosing";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { skillEvidence } from "@/config/skillEvidence";
import { skillIcons } from "@/config/skillIcons";
import { skillLayers } from "@/config/skillLayers";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { useDismissOutside } from "@/hooks/use-dismiss-outside";
import { useIsMobile, usePrefersReducedMotion } from "@/hooks/use-media-query";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useTimelineSelection } from "@/hooks/use-timeline-selection";
import { useExperiences, useProjects, useSkills } from "@/lib/queries";
import { claimsEarlier, laneSegments } from "@/lib/skillLanes";
import { rolesForSkill } from "@/lib/skillRoles";
import { formatYears, parseYears } from "@/lib/skillYears";
import { fillTemplate, formatCounter } from "@/lib/text";
import { buildTimeline, companyShortName } from "@/lib/timeline";
import { translations } from "@/utils/translations";

/**
 * The career as a drawing to scale, and one role at a time out of it. The
 * timeline is what a stack of cards could never show: how long each role ran
 * and which ones ran together. Choosing a company's circle opens its entry
 * out of the circle, over the timeline rather than below the fold. The open
 * role is in the address as `#company`, so a link can open it.
 */

const SECTION_COUNT = 2;
const eyebrow = (index: number) => formatCounter(index, SECTION_COUNT);

const Experience = () => {
  const [chosenSkill, setChosenSkill] = useState<number | null>(null);
  const [previewRole, setPreviewRole] = useState<number | null>(null);
  // A role chosen in the sidebar beside the skills: its skills light up.
  const [sidebarRole, setSidebarRole] = useState<number | null>(null);
  const [phase, setPhase] = useState<FlightPhase>("timeline");
  const skillList = useRef<HTMLDivElement>(null);
  const timelineArea = useRef<HTMLDivElement>(null);
  const sidebar = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const { language } = useSettings();
  const { askVex } = useVex();
  const t = translations[language];
  usePageMeta(t.meta.experience);
  const experiencesQuery = useExperiences();
  const experiences = useMemo(() => experiencesQuery.data ?? [], [experiencesQuery.data]);

  // The roles in the order they began, as the timeline lays them out, each
  // with its circle and its name in the address.
  // The career on its axis, shared by the timeline's order and the skill lanes.
  const career = useMemo(() => buildTimeline(experiences, new Date()), [experiences]);

  const roles = useMemo(() => {
    const byId = new Map(experiences.map((experience) => [experience.id, experience]));
    return career.spans.flatMap((span) => {
      const experience = byId.get(span.id);
      if (!experience) return [];
      const shortName = companyShortName(experience.company);
      const entry: TimelineEntry<number> = {
        id: experience.id,
        start: experience.start,
        end: experience.end,
        label: experience.company,
        shortLabel: shortName,
        ariaLabel: `${experience.company}, ${experience.period}`,
        // The button's rim edges the circle, so the mark needs no hairline.
        mark: (
          <CompanyMark
            company={experience.company}
            className="size-full text-xs ring-0 md:text-sm"
          />
        ),
      };
      return [
        { experience, entry, name: experience.company, shortName, slug: shortName.toLowerCase() },
      ];
    });
  }, [experiences, career]);
  const entries = useMemo(() => roles.map((role) => role.entry), [roles]);
  const items = useMemo(
    () =>
      roles.map(({ entry, name, shortName, slug }) => ({ id: entry.id, name, shortName, slug })),
    [roles],
  );
  const { selectedId, open, select, close } = useTimelineSelection(items);

  // The skills, with the roles each was used in: a skill counts as used in a
  // role when the role's own technologies name one that proves it. Skills
  // that fail to load leave the section out rather than the page broken;
  // projects count as evidence too, by their tags, and without them the
  // lanes simply list none.
  const skillsQuery = useSkills();
  const skills = useMemo(
    () =>
      (skillsQuery.data ?? []).map((skill) => ({
        ...skill,
        icon: skillIcons[skill.id] ?? skill.icon,
      })),
    [skillsQuery.data],
  );
  const projectsQuery = useProjects();
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const rolesBySkill = useMemo(
    () =>
      new Map(
        skills.map((skill) => [
          skill.id,
          rolesForSkill(skillEvidence[skill.id] ?? [], experiences),
        ]),
      ),
    [skills, experiences],
  );
  const highlighted = useMemo(
    () => (chosenSkill === null ? null : new Set(rolesBySkill.get(chosenSkill) ?? [])),
    [chosenSkill, rolesBySkill],
  );
  // A skill and a sidebar role are chosen independently, so a role's band
  // stays while its skills are looked at one by one; a press anywhere else
  // lets go of both.
  const chooseRole = (id: number) => setSidebarRole((now) => (now === id ? null : id));
  useDismissOutside(chosenSkill !== null || sidebarRole !== null, skillList, () => {
    setChosenSkill(null);
    setSidebarRole(null);
  });

  // Each skill's lane: the months of the roles that prove it, the roles
  // themselves as small marks, and the projects whose tags name it.
  const lanes = useMemo(() => {
    const spans = new Map(career.spans.map((span) => [span.id, span]));
    const tagged = projects.map((project) => ({
      id: project.title,
      technologies: project.technologies,
    }));
    return new Map<number, SkillLane>(
      skills.map((skill) => {
        const roleIds = rolesBySkill.get(skill.id) ?? [];
        const segments = laneSegments(roleIds.flatMap((id) => spans.get(id) ?? []));
        return [
          skill.id,
          {
            segments,
            earlier: claimsEarlier(segments, parseYears(skill.level), career.months),
            projects: rolesForSkill(skillEvidence[skill.id] ?? [], tagged),
            roles: roleIds.flatMap((id) => {
              const experience = experiences.find((candidate) => candidate.id === id);
              return experience
                ? [
                    {
                      id,
                      name: experience.company,
                      mark: (
                        <CompanyMark
                          key={id}
                          company={experience.company}
                          className="size-6 text-[9px] ring-2 ring-background"
                        />
                      ),
                    },
                  ]
                : [];
            }),
          },
        ];
      }),
    );
  }, [skills, projects, experiences, career, rolesBySkill]);

  // The band through the lanes: the sidebar's chosen role, else the role
  // pointed at on the timeline.
  const bandSpan = career.spans.find((span) => span.id === (sidebarRole ?? previewRole));
  const band = bandSpan
    ? { id: bandSpan.id, startMonth: bandSpan.startMonth, endMonth: bandSpan.endMonth }
    : null;

  // The circles fly to the sidebar as the reader scrolls down; on a phone,
  // or with reduced motion, both sets simply stay where they are.
  const flight = !isMobile && !prefersReducedMotion && roles.length > 0;
  const flightRoles = useMemo(
    () =>
      roles.map((role) => ({
        id: role.entry.id,
        mark: (
          <CompanyMark company={role.experience.company} className="size-full text-sm ring-0" />
        ),
        className: circleState(
          role.entry.id === sidebarRole,
          highlighted?.has(role.entry.id) ?? false,
        ),
      })),
    [roles, sidebarRole, highlighted],
  );

  const entryLabels = {
    keyAchievements: t.experience.keyAchievements,
    technologies: t.experience.technologies,
    askVex: t.experience.askVex,
    askVexQuestion: t.experience.askVexQuestion,
  };
  const timelineLabels = {
    figure: t.experience.timeline.figure,
    now: t.experience.timeline.now,
  };

  return (
    <PageLayout>
      {/* Every subpage opens the same way: the header alone on the page
          background, then its first section on white, the sections after
          it alternating, and the closing on the colour field. */}
      <Section className="relative isolate overflow-hidden md:py-10">
        <HeaderShapes variant="experience" />
        <SectionHeading
          level={1}
          eyebrow={t.nav.experience}
          title={t.experience.title}
          leadLine={t.experience.subtitle}
          // mb-0 at every width: the heading's own md:mb-12 would add a gap
          // under the lead that the band's padding already gives.
          className="mb-0 md:mb-0"
        />
      </Section>

      <Section id="roles" tone="surface">
        <SectionHeading eyebrow={eyebrow(1)} title={t.experience.rolesTitle} />
        {queryStatus([experiencesQuery], {
          loading: t.common.loading,
          error: t.experience.error,
          retry: t.experience.tryAgain,
        }) ??
          (experiences.length === 0 ? (
            <StatusMessage variant="empty" message={t.experience.noData} />
          ) : (
            <>
              <div ref={timelineArea}>
                <Reveal>
                  <CareerTimeline<number>
                    entries={entries}
                    timeline={career}
                    labels={timelineLabels}
                    selectedId={selectedId}
                    onSelect={select}
                    highlightedIds={highlighted}
                    onPreview={setPreviewRole}
                    circlesAway={flight && phase !== "timeline"}
                    enterFromEdges
                  />
                </Reveal>
              </div>
              <TimelineDialog
                items={items}
                selectedId={selectedId}
                open={open}
                onSelect={select}
                onClose={close}
                labels={t.experience.dialog}
              >
                {(id, closeDialog, Heading) => {
                  const role = roles.find((candidate) => candidate.entry.id === id);
                  return (
                    role && (
                      <RoleEntry
                        experience={role.experience}
                        labels={entryLabels}
                        Heading={Heading}
                        // Shrink the entry away first, so the chat opens on the page.
                        onAsk={(question) => closeDialog(() => askVex(question))}
                      />
                    )
                  );
                }}
              </TimelineDialog>
            </>
          ))}
      </Section>

      {/* The skills on the timeline's axis, with the roles beside them as a
          sidebar the timeline's circles fly into; choosing a skill lights up
          its roles, choosing a role lights up its skills. */}
      {skills.length > 0 && (
        <Section id="skills" className="py-12 md:py-16">
          <SectionHeading
            eyebrow={eyebrow(2)}
            title={t.skills.title}
            leadLine={t.skills.subtitle}
          />
          {/* The roles as a sidebar, where the timeline's circles land, and
              the skills beside them. From md the first circle starts on the
              axis line, its name beside the years. Stuck, the circles sit
              where they land at the end of the flight. */}
          <div ref={skillList} className="md:grid md:grid-cols-[3rem_minmax(0,1fr)] md:gap-x-10">
            <div
              ref={sidebar}
              className="sticky top-16 z-20 -mx-4 mb-6 bg-background/90 px-4 py-3 backdrop-blur-sm md:top-[5.25rem] md:mx-0 md:mb-0 md:self-start md:bg-transparent md:p-0 md:backdrop-blur-none"
            >
              <RoleSidebar
                roles={roles.map((role) => ({
                  id: role.entry.id,
                  company: role.experience.company,
                  period: role.experience.period,
                }))}
                selectedId={sidebarRole}
                onToggle={chooseRole}
                onOpen={select}
                highlightedIds={highlighted}
                circlesHidden={flight && phase !== "sidebar"}
                labels={{
                  list: t.skills.roles,
                  show: (company) => fillTemplate(t.skills.showSkills, { company }),
                  open: t.skills.openRole,
                  openFull: (company) => fillTemplate(t.skills.openRoleFull, { company }),
                }}
              />
            </div>
            <SkillLanes
              skills={skills}
              axis={career}
              lanes={lanes}
              layers={skillLayers.map((layer) => ({
                ...layer,
                label: t.skills.layers[layer.key],
              }))}
              labels={{
                years: (count) => formatYears(count, language),
                level: (level) => t.skills.levels[level] ?? level,
                show: (name) => fillTemplate(t.skills.show, { name }),
                outsideRoles: t.skills.outsideRoles,
                earlier: t.skills.earlier,
                projects: t.skills.projects,
                roles: t.skills.roles,
                more: (count) => fillTemplate(t.skills.more, { count }),
              }}
              selectedId={chosenSkill}
              onSelect={setChosenSkill}
              band={band}
            />
          </div>
          {flight && (
            <CircleFlight
              roles={flightRoles}
              section={skillList}
              from={timelineArea}
              to={sidebar}
              onPhase={setPhase}
            />
          )}
        </Section>
      )}

      {/* How the page ends, as every subpage does: a question in its own
          terms and two ways to answer it. */}
      {/* Pushed to the foot of a short page, so it closes the page right
          above the footer rather than leaving a gap under it. */}
      <HeatField className="mt-auto">
        <Section className="py-12 md:py-20">
          <PageClosing
            title={t.experience.closing.title}
            body={t.experience.closing.body}
            labels={{ email: t.experience.closing.email, askVex: t.hero.askAI }}
            next={{ ...t.experience.closing.next, to: "/research" }}
          />
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Experience;
