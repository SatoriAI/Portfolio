import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  Brain,
  Code,
  Database,
  Github,
  Mail,
  MessageSquare,
  Server,
} from "lucide-react";

import AskVexBar from "@/components/AskVexBar";
import HeatField, { HeatCaption } from "@/components/brand/HeatField";
import FeaturedProjectCard from "@/components/cards/FeaturedProjectCard";
import ProjectCard from "@/components/cards/ProjectCard";
import SkillCard from "@/components/cards/SkillCard";
import { Col, Grid, type Span12 } from "@/components/layout/Grid";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import ProofPoints from "@/components/ProofPoints";
import Reveal from "@/components/Reveal";
import SwipeCarousel from "@/components/SwipeCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageMeta } from "@/hooks/use-page-meta";
import type { UiProject } from "@/lib/projectsService";
import { fetchProjects } from "@/lib/projectsService";
import type { UiSkill } from "@/lib/skillsService";
import { fetchSkills } from "@/lib/skillsService";
import { translations } from "@/utils/translations";

const GITHUB_URL = "https://github.com/SatoriAI";
const EMAIL = "dawidhanrahan@gmail.com";

// Card reveals stagger by 50–70ms and stop after the third item (kit).
const staggerMs = (index: number) => Math.min(index, 2) * 60;

/**
 * How wide each project after the first should be, so the row always fills the
 * grid. Hard-coding the column count is what left a 339px dead column whenever
 * the API returned exactly three projects.
 */
const secondaryProjectSpan = (count: number): Span12 =>
  count >= 4 ? 3 : count === 3 ? 4 : count === 2 ? 6 : 12;

const sampleSkills: UiSkill[] = [
  {
    icon: Code,
    name: "Python",
    level: "Expert",
    description: "Backend development, APIs, automation",
  },
  {
    icon: Database,
    name: "Databases",
    level: "Advanced",
    description: "PostgreSQL, MongoDB, Redis",
  },
  {
    icon: Brain,
    name: "LLMs & RAG",
    level: "Expert",
    description: "Pipeline development, vector databases",
  },
  {
    icon: Server,
    name: "Infrastructure",
    level: "Advanced",
    description: "AWS, Docker, Kubernetes",
  },
];

const sampleProjects: UiProject[] = [
  {
    title: "Intelligent Document RAG System",
    description:
      "Built a sophisticated RAG pipeline for document analysis using vector embeddings and LLMs",
    technologies: ["Python", "LangChain", "ChromaDB", "OpenAI"],
    github: "#",
    demo: "#",
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop",
  },
  {
    title: "Scalable Backend Architecture",
    description: "Designed and implemented microservices architecture handling 1M+ requests daily",
    technologies: ["Python", "FastAPI", "PostgreSQL", "Redis"],
    github: "#",
    demo: "#",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop",
  },
  {
    title: "Infrastructure Automation Suite",
    description: "Created comprehensive DevOps pipeline with automated testing and deployment",
    technologies: ["Python", "Terraform", "AWS", "Docker"],
    github: "#",
    demo: "#",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
  },
];

const Index = () => {
  const { askVex } = useVex();
  const { language } = useSettings();
  const t = translations[language];
  const isMobile = useIsMobile();
  usePageMeta(t.meta.home);

  const [projects, setProjects] = useState<UiProject[]>(sampleProjects);
  const [skills, setSkills] = useState<UiSkill[]>(sampleSkills);

  useEffect(() => {
    if (env.mock) return;
    fetchProjects(language)
      .then(setProjects)
      .catch((err) => {
        console.error("Failed to fetch projects, falling back to sample data:", err);
        setProjects(sampleProjects);
      });
  }, [language]);

  useEffect(() => {
    if (env.mock) return;
    fetchSkills(language)
      .then(setSkills)
      .catch((err) => {
        console.error("Failed to fetch skills, falling back to sample data:", err);
        setSkills(sampleSkills);
      });
  }, [language]);

  const projectLabels = {
    code: t.projects.code,
    demo: t.common.demo,
    privateProject: t.common.privateProject,
    imageAlt: t.projects.imageAlt,
  };
  const projectKey = (project: UiProject) => project.title;
  const [featuredProject, ...otherProjects] = projects;

  return (
    <PageLayout>
      {/* Hero. The field behind it is a live heat kernel: two point sources
          spreading into the kit's colour fields once after load, with the
          equation and the kernel time printed under the copy. The previous
          pass ruled that nothing in the hero animates; this is the one thing
          that earns an exception, because it is the brand line made visible —
          the mathematics is literally running under the engineering. The
          heading and copy still do not move.

          Vex is asked from here rather than from a corner button. A field you
          can type a question into is the site's unusual thing, so it sits
          where the eye lands, not behind a launcher. */}
      <HeatField placement="top" live>
        <Section id="hero" className="pb-8 pt-12 md:pb-10 md:pt-20">
          <Grid gapY={48} className="lg:items-end">
            {/* No max-width here: the column is the measure. The subtitle keeps
                its own 65ch cap, and a width cap on the column would pull it off
                the grid axis. */}
            <Col spanLg={8}>
              <p className="mb-4 font-mono text-meta uppercase tracking-wide text-iris">
                Dawid Hanrahan
              </p>
              <h1 className="text-display-sm md:text-display">{t.hero.title}</h1>
              <p className="mt-5 max-w-[65ch] text-base text-muted-foreground md:text-body-lg">
                {t.hero.subtitle}
              </p>
              <AskVexBar
                className="mt-6 max-w-[40rem]"
                placeholder={t.hero.askPlaceholder}
                submitLabel={t.hero.ask}
                starters={t.chat.starters}
                onAsk={askVex}
              />
              <p className="mt-3 font-mono text-meta text-muted-foreground">{t.hero.askHint}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="outline" asChild>
                  <Link to="/#projects">
                    {t.hero.viewProjects}
                    <ArrowDown />
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub"
                    >
                      <Github className="!size-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={`mailto:${EMAIL}`} aria-label={t.contact.email}>
                      <Mail className="!size-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </Col>
            <Col spanLg={4} align="end">
              <ProofPoints items={t.hero.proof} />
            </Col>
          </Grid>
          <HeatCaption
            className="mt-10 block md:mt-12"
            label={t.hero.field.label}
            replayLabel={t.hero.field.replay}
            locale={language}
          />
        </Section>
      </HeatField>

      {/* About */}
      <Section id="about">
        <SectionHeading eyebrow={`01 / ${t.nav.about}`} title={t.about.title} />
        {/* Splits at lg, not md: a half column at md is ~39 characters per
            line, under the kit's 55-70 range. */}
        <Grid gapY={48}>
          <Col spanLg={6} className="space-y-6">
            <p className="text-base text-muted-foreground md:text-body-lg">{t.about.paragraph1}</p>
            <p className="text-base text-muted-foreground md:text-body-lg">{t.about.paragraph2}</p>
          </Col>
          {/* The lavender panel now faces the prose on its own axis. It carries
              the pastel at column scale rather than as a badge, which is where
              the kit's 20% allocation was meant to be spent. */}
          <Col as={Reveal} spanLg={6}>
            <Card tone="lavender">
              <CardHeader>
                <CardTitle className="text-xl md:text-xl">{t.about.philosophy}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t.about.philosophyText}</p>
              </CardContent>
            </Card>
          </Col>
        </Grid>
      </Section>

      {/* Skills */}
      <Section id="skills">
        <SectionHeading
          eyebrow={`02 / ${t.nav.skills}`}
          title={t.skills.title}
          lead={t.skills.subtitle}
        />
        <Grid>
          {skills.map((skill, index) => (
            <Col
              as={Reveal}
              key={skill.name}
              spanSm={2}
              spanLg={3}
              delayMs={staggerMs(index)}
              className="h-full"
            >
              <SkillCard skill={skill} className="h-full" />
            </Col>
          ))}
        </Grid>
      </Section>

      {/* Projects: one card at a time on phones; on larger screens the first
          project takes the full width and the rest share one row (1 + 3). */}
      <Section id="projects">
        <SectionHeading
          eyebrow={`03 / ${t.nav.projects}`}
          title={t.projects.title}
          lead={t.projects.subtitle}
        />
        {isMobile ? (
          <SwipeCarousel
            items={projects}
            getKey={projectKey}
            storageKey="swipeHintSeen.projects"
            hintText={t.hints.swipeMore}
            renderItem={(project) => <ProjectCard project={project} labels={projectLabels} />}
          />
        ) : (
          projects.length > 0 && (
            <div className="space-y-6">
              <Reveal>
                <FeaturedProjectCard project={featuredProject} labels={projectLabels} />
              </Reveal>
              {otherProjects.length > 0 && (
                <Grid>
                  {otherProjects.map((project, index) => (
                    <Col
                      as={Reveal}
                      key={projectKey(project)}
                      spanMd={6}
                      spanLg={secondaryProjectSpan(otherProjects.length)}
                      delayMs={staggerMs(index)}
                      className="h-full"
                    >
                      <ProjectCard project={project} labels={projectLabels} className="h-full" />
                    </Col>
                  ))}
                </Grid>
              )}
            </div>
          )
        )}
      </Section>

      {/* Contact: the same field, at rest, closing the page. */}
      <HeatField>
        <Section id="contact">
          <SectionHeading
            eyebrow={`04 / ${t.nav.contact}`}
            title={t.contact.title}
            lead={t.contact.subtitle2}
          />
          <Grid>
            <Col spanMd={6} className="grid gap-6">
              <Reveal>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl md:text-xl">
                      <Mail className="h-5 w-5 text-iris" aria-hidden="true" />
                      {t.contact.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-iris underline decoration-1 underline-offset-4 hover:text-primary"
                    >
                      {EMAIL}
                    </a>
                  </CardContent>
                </Card>
              </Reveal>
              <Reveal delayMs={60}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl md:text-xl">
                      <Github className="h-5 w-5 text-iris" aria-hidden="true" />
                      GitHub
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-iris underline decoration-1 underline-offset-4 hover:text-primary"
                    >
                      github.com/SatoriAI
                    </a>
                  </CardContent>
                </Card>
              </Reveal>
            </Col>
            <Col as={Reveal} spanMd={6} delayMs={120} className="h-full">
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle className="text-xl md:text-xl">{t.contact.quickMessage}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <p className="text-muted-foreground">{t.contact.quickMessageDesc}</p>
                  <Button onClick={() => askVex()} className="w-full sm:w-auto">
                    <MessageSquare />
                    {t.hero.askAI}
                  </Button>
                </CardContent>
              </Card>
            </Col>
          </Grid>
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Index;
