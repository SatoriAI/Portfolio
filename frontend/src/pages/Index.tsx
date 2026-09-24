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
import BinaryAxisMark from "@/components/brand/BinaryAxisMark";
import HeatField, { HeatCaption } from "@/components/brand/HeatField";
import ProjectIndex from "@/components/home/ProjectIndex";
import SkillYears from "@/components/home/SkillYears";
import { Col, Grid } from "@/components/layout/Grid";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import ProofPoints from "@/components/ProofPoints";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import type { UiProject } from "@/lib/projectsService";
import { fetchProjects } from "@/lib/projectsService";
import type { UiSkill } from "@/lib/skillsService";
import { fetchSkills } from "@/lib/skillsService";
import { formatYears } from "@/lib/skillYears";
import { translations } from "@/utils/translations";

const GITHUB_URL = "https://github.com/SatoriAI";
const EMAIL = "dawidhanrahan@gmail.com";

const sampleSkills: UiSkill[] = [
  {
    icon: Code,
    name: "Python",
    level: "10+ years of experience",
    description: "Backend development, APIs, automation",
  },
  {
    icon: Database,
    name: "Databases",
    level: "5+ years of experience",
    description: "PostgreSQL, MongoDB, Redis",
  },
  {
    icon: Brain,
    name: "LLMs & RAG",
    level: "3+ years of experience",
    description: "Pipeline development, vector databases",
  },
  {
    icon: Server,
    name: "Infrastructure",
    level: "5+ years of experience",
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
    stack: t.projects.stack,
    youAreHere: t.projects.youAreHere,
    askVex: t.projects.askVex,
    askVexQuestion: t.projects.askVexQuestion,
  };

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

      {/* About. The mark, at a size where it can be read, faces the prose: the
          identity's second layer (0 · 1 → dh) is one hover away, and the copy
          beside it says the same thing in words. */}
      <Section id="about">
        <SectionHeading eyebrow={`01 / ${t.nav.about}`} title={t.about.title} />
        <Grid gapY={48}>
          <Col as={Reveal} spanLg={4}>
            <BinaryAxisMark labels={t.about.mark} />
            <p className="mt-6 max-w-[28ch] font-mono text-meta text-muted-foreground">
              {t.about.markHint}
            </p>
          </Col>
          {/* Splits at lg, not md: a half column at md is ~39 characters per
              line, under the kit's 55-70 range. The text keeps its own 65ch cap
              inside the 8-column span. */}
          <Col spanLg={8} className="space-y-6">
            <p className="max-w-[65ch] text-base text-muted-foreground md:text-body-lg">
              {t.about.paragraph1}
            </p>
            <p className="max-w-[65ch] text-base text-muted-foreground md:text-body-lg">
              {t.about.paragraph2}
            </p>
            <Reveal>
              <Card tone="lavender">
                <CardHeader>
                  <CardTitle className="text-xl md:text-xl">{t.about.philosophy}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="max-w-[65ch] text-muted-foreground">{t.about.philosophyText}</p>
                </CardContent>
              </Card>
            </Reveal>
          </Col>
        </Grid>
      </Section>

      {/* Skills, as years. Icon tiles said nothing a visitor could weigh; a
          row of modules per year, with the running year as the kit's single
          filled module, is the same data made legible. */}
      <Section id="skills">
        <SectionHeading
          eyebrow={`02 / ${t.nav.skills}`}
          title={t.skills.title}
          lead={t.skills.subtitle}
        />
        <SkillYears skills={skills} labels={{ years: (count) => formatYears(count, language) }} />
      </Section>

      {/* Projects, as an index: titles in a column, the selected one opened
          beside them and read in sequence. The images the backend holds are
          app icons and are shown at icon size. */}
      <Section id="projects">
        <SectionHeading
          eyebrow={`03 / ${t.nav.projects}`}
          title={t.projects.title}
          lead={t.projects.subtitle}
        />
        <Reveal>
          <ProjectIndex projects={projects} labels={projectLabels} onAsk={askVex} />
        </Reveal>
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
