import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import HeaderShapes from "@/components/brand/HeaderShapes";
import HeatField from "@/components/brand/HeatField";
import StatusMessage from "@/components/feedback/StatusMessage";
import AboutDefinition from "@/components/home/AboutDefinition";
import CheckProof from "@/components/home/CheckProof";
import Circuit from "@/components/home/Circuit";
import ContactGraph from "@/components/home/ContactGraph";
import HeroTheorem from "@/components/home/HeroTheorem";
import ProjectIndex from "@/components/home/ProjectIndex";
import RouteList from "@/components/home/RouteList";
import WorkshopFeature from "@/components/home/WorkshopFeature";
import { Col, Grid } from "@/components/layout/Grid";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { EMAIL } from "@/config/contact";
import { arrangeProjects } from "@/config/projectOrder";
import { screenshotsFor } from "@/config/projectScreenshots";
import { projectCard } from "@/content/projects";
import { showDrafts, workshopArticles } from "@/content/workshop";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { useLiveChecks } from "@/hooks/use-live-checks";
import { usePageMeta } from "@/hooks/use-page-meta";
import { isThisSite } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { fetchProjects } from "@/lib/projectsService";
import { articlesFor } from "@/lib/workshop";
import { translations } from "@/utils/translations";

const GITHUB_URL = "https://github.com/SatoriAI";

/** How many pieces from the workshop the home page shows, newest first. */
const WORKSHOP_ON_HOME = 3;

const Index = () => {
  const { askVex } = useVex();
  const { language } = useSettings();
  const t = translations[language];
  usePageMeta(t.meta.home);

  // The real projects or nothing: if they cannot be loaded the section says
  // so and offers a retry. It never stands in invented work.
  // The workshop's newest pieces; the section is left out while there are none.
  const pieces = articlesFor(workshopArticles, language, { drafts: showDrafts }).slice(
    0,
    WORKSHOP_ON_HOME,
  );
  const w = t.workshop;
  // Sections are numbered as they are shown.
  const sectionCount = pieces.length > 0 ? 4 : 3;
  const eyebrow = (index: number) =>
    `${String(index).padStart(2, "0")} / ${String(sectionCount).padStart(2, "0")}`;
  const after = pieces.length > 0 ? 1 : 0;

  const [projects, setProjects] = useState<UiProject[] | null>(null);
  // The live checks of the projects' addresses, here so that the sentence
  // under the heading and the strip of projects read the same results.
  const liveChecks = useLiveChecks();
  const checked = useMemo(
    () => (projects ?? []).filter((project) => project.demo && !isThisSite(project)),
    [projects],
  );
  const { checkAllOnce } = liveChecks;
  const startChecks = useCallback(
    () => checkAllOnce(checked.map((project) => project.demo)),
    [checkAllOnce, checked],
  );
  const [failed, setFailed] = useState(false);
  const loadProjects = useCallback(() => {
    setFailed(false);
    setProjects(null);
    fetchProjects(language)
      // Where a project has a document, its summary and stack replace the
      // backend's description and tags.
      .then((list) =>
        setProjects(
          arrangeProjects(list).map((p) => {
            const card = projectCard(p.title, language);
            return card ? { ...p, description: card.summary, technologies: [...card.stack] } : p;
          }),
        ),
      )
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
        setFailed(true);
      });
  }, [language]);
  useEffect(loadProjects, [loadProjects]);

  const projectLabels = {
    code: t.projects.code,
    codeOnGithub: t.projects.codeOnGithub,
    codePrivate: t.projects.codePrivate,
    stack: t.projects.stack,
    stackNext: t.projects.stackNext,
    youAreHere: t.projects.youAreHere,
    notPublic: t.projects.notPublic,
    askVex: t.projects.askVex,
    askVexQuestion: t.projects.askVexQuestion,
    quoted: t.projects.quoted,
    screenshotAlt: t.projects.screenshotAlt,
    previous: t.projects.previous,
    next: t.projects.next,
    live: t.projects.live,
  };

  return (
    <PageLayout>
      {/* One wire through the page, from the theorem to me (see Circuit). */}
      <Circuit>
        {/* Hero. A masthead rather than a stage: the brand line as a theorem,
            its proof under it (see HeroTheorem), so the projects below
            are the first screen's real content. The bands alternate from the
            white Projects band down, so the masthead reads apart from what
            follows. */}
        <Section
          id="hero"
          className="relative isolate overflow-hidden pb-8 pt-10 md:pb-12 md:pt-10"
        >
          <HeaderShapes variant="home" />
          <HeroTheorem
            labels={{
              theorem: t.hero.theorem,
              statement: t.hero.statement,
              and: t.hero.and,
              proof: t.hero.proof,
              lines: t.hero.proofLines,
            }}
          />
        </Section>

        {/* Projects come first after the hero, as the kit's structure asks:
            an index of titles with the selected one opened beside them and read
            in sequence. The images the backend holds are app icons and are shown
            at icon size. */}
        <Section id="projects" tone="surface">
          <SectionHeading
            eyebrow={eyebrow(1)}
            title={t.projects.title}
            note={
              checked.length > 0 && (
                <CheckProof
                  checks={checked.map((project) => liveChecks.stateOf(project.demo))}
                  labels={t.projects.proof}
                  locale={language}
                  onSeen={startChecks}
                />
              )
            }
          />
          {failed ? (
            <StatusMessage
              variant="error"
              message={t.projects.error}
              onRetry={loadProjects}
              retryLabel={t.projects.tryAgain}
            />
          ) : projects === null ? (
            <StatusMessage variant="loading" message={t.common.loading} />
          ) : (
            <Reveal>
              <ProjectIndex
                projects={projects}
                subtitles={t.projects.subtitles}
                facts={t.projects.facts}
                screenshots={screenshotsFor(language)}
                labels={projectLabels}
                onAsk={askVex}
                checks={liveChecks}
              />
            </Reveal>
          )}
        </Section>

        {/* From the workshop: the heading and its lead beside the newest pieces,
            the newest set larger, and the way to all of them, so one piece
            fills the row as well as several do. Left out while there are none. */}
        {pieces.length > 0 && (
          <Section id="workshop">
            <WorkshopFeature
              articles={pieces}
              locale={language}
              labels={{
                eyebrow: eyebrow(2),
                title: w.title,
                lead: w.lead,
                all: w.all,
                minutes: w.minutes,
                figure: w.figure,
              }}
            />
          </Section>
        )}

        {/* About. Who I am as a definition, as the hero is a theorem, then the
            four pages that tell the rest, so the page leads on into the full
            record. On the surface tone after the workshop, so the bands keep
            alternating. */}
        <Section id="about" tone={pieces.length > 0 ? "surface" : "default"}>
          <SectionHeading eyebrow={eyebrow(2 + after)} title={t.about.title} />
          <Grid gapY={32}>
            <Col spanLg={7}>
              <AboutDefinition labels={t.about.definition} />
            </Col>
            <Col as={Reveal} spanLg={5}>
              <RouteList
                routes={[
                  {
                    kind: "experience",
                    to: "/experience",
                    name: t.nav.experience,
                    line: t.about.routes.experience,
                  },
                  {
                    kind: "research",
                    to: "/research",
                    name: t.nav.academic,
                    line: t.about.routes.research,
                  },
                  {
                    kind: "education",
                    to: "/education",
                    name: t.nav.education,
                    line: t.about.routes.education,
                  },
                  {
                    kind: "workshop",
                    to: "/workshop",
                    name: t.nav.workshop,
                    // The newest piece, so the way in says what is new there.
                    line: pieces[0]
                      ? t.about.routes.workshop.replace("{title}", pieces[0].title)
                      : w.lead,
                  },
                ]}
              />
            </Col>
          </Grid>
        </Section>

        {/* Contact: the same field, at rest, closing the page. The ways to
            reach me as a graph around my mark, the nodes being the controls. */}
        <HeatField>
          <Section id="contact" className="py-12 md:py-20">
            <SectionHeading
              eyebrow={eyebrow(3 + after)}
              title={t.contact.title}
              leadLine={t.contact.lead}
            />
            <Grid>
              <Col as={Reveal} spanLg={12}>
                <ContactGraph
                  email={EMAIL}
                  githubUrl={GITHUB_URL}
                  onAskVex={() => askVex()}
                  labels={t.contact.list}
                />
              </Col>
            </Grid>
          </Section>
        </HeatField>
      </Circuit>
    </PageLayout>
  );
};

export default Index;
