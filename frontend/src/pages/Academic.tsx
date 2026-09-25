import { useCallback, useEffect, useState } from "react";
import { Mail, MessageSquare } from "lucide-react";

import CyclicShiftFigure from "@/components/academic/CyclicShiftFigure";
import HeatKernelFigure from "@/components/academic/HeatKernelFigure";
import Notice from "@/components/academic/Notice";
import PublicationStack from "@/components/academic/PublicationStack";
import QubitFigure from "@/components/academic/QubitFigure";
import QuoteWall from "@/components/academic/QuoteWall";
import ResearchThread from "@/components/academic/ResearchThread";
import HeatField from "@/components/brand/HeatField";
import StatusMessage from "@/components/feedback/StatusMessage";
import { MathText } from "@/components/Formula";
import { Col, Grid } from "@/components/layout/Grid";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { UiPublication, usePublications } from "@/lib/publicationsService";
import { UiSchool, useSchools } from "@/lib/schoolsService";
import { UiTestimonial, useTestimonials } from "@/lib/testimonialsService";
import { translations } from "@/utils/translations";

const EMAIL = "dawidhanrahan@gmail.com";

// The degrees read forward, earliest first: three steps of one line of work.
const chronological = (schools: readonly UiSchool[]) =>
  [...schools].sort((a, b) => a.startDate.localeCompare(b.startDate));

/**
 * The kernel figure's t runs 0.02–2; the field's time is in units of its
 * resting spread, so t = 2 is the field at rest and small t is heat still
 * gathered at the sources.
 */
const fieldTimeFor = (t: number) => t / 2;

const SECTION_COUNT = 5;
const eyebrow = (index: number) =>
  `${String(index).padStart(2, "0")} / ${String(SECTION_COUNT).padStart(2, "0")}`;

/**
 * What the teaching section can say from the testimonials alone: the courses
 * named in them and the academic years they span. Nothing here is asserted
 * that the data does not carry.
 */
const teachingFacts = (testimonials: readonly UiTestimonial[]) => {
  const courses = [...new Set(testimonials.map((t) => t.course).filter(Boolean))];
  const years = testimonials
    .map((t) => /\d{4}\/\d{2}/.exec(t.semester)?.[0])
    .filter((year): year is string => Boolean(year))
    .sort();
  return { courses, from: years[0], to: years[years.length - 1] };
};

/**
 * Research and teaching, told in the order of the work's standing: the
 * question the page asks and a heat kernel to run; the established work
 * with its two papers; the current investigation; a developing interest,
 * smaller; the degrees; the teaching; and a way to write.
 */
const Academic = () => {
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [publications, setPublications] = useState<UiPublication[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldTime, setFieldTime] = useState(1);
  const { language } = useSettings();
  const { askVex } = useVex();
  const t = translations[language];
  const story = t.academic.story;
  usePageMeta(t.meta.research);
  const schoolsService = useSchools();
  const publicationsService = usePublications();
  const testimonialsService = useTestimonials();

  const loadAcademicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [schoolsData, publicationsData, testimonialsData] = await Promise.all([
        schoolsService.fetch(),
        publicationsService.fetch(),
        testimonialsService.fetch(),
      ]);
      setSchools(schoolsData);
      setPublications(publicationsData);
      setTestimonials(testimonialsData);
    } catch (err) {
      console.error("Failed to fetch academic data:", err);
      setError("Failed to load academic data");
    } finally {
      setLoading(false);
    }
    // The services close over the current language; that is the only input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    loadAcademicData();
  }, [loadAcademicData]);

  const threadLabels = {
    advisor: t.academic.advisor,
    researchAreas: t.academic.researchAreas,
    more: t.academic.more,
    less: t.academic.less,
  };
  const publicationLabels = {
    view: t.academic.view,
    stack: t.academic.stack,
    venue: t.academic.venue,
    year: t.academic.year,
    established: t.academic.established,
    showAbstract: t.academic.showAbstract,
    hideAbstract: t.academic.hideAbstract,
  };
  const facts = teachingFacts(testimonials);
  const teachingIntro =
    facts.courses.length > 0 && facts.from && facts.to
      ? story.teaching.intro
          .replace("{courses}", facts.courses.join(", "))
          .replace("{from}", facts.from)
          .replace("{to}", facts.to)
      : null;

  const contents = [
    { id: "kernels", label: story.kernels.title },
    { id: "transformers", label: t.academic.interests.transformers.title },
    { id: "quantum", label: t.academic.interests.quantum.title },
    { id: "education", label: t.academic.education },
    { id: "teaching", label: story.teaching.title },
  ];

  // All three lists share one request, so they share one status block.
  const status = loading ? (
    <StatusMessage variant="loading" message={t.common.loading} />
  ) : error ? (
    <StatusMessage
      variant="error"
      message={t.academic.error}
      onRetry={loadAcademicData}
      retryLabel={t.academic.tryAgain}
    />
  ) : null;

  return (
    <PageLayout>
      {/* The header's field is not on its own clock: the kernel figure drives
          it, so dragging t spreads the heat behind the title too. Reading
          order on a phone is title, figure, explanation; on a desktop the
          explanation sits under the title and the figure spans both rows. */}
      <HeatField placement="top" time={fieldTimeFor(fieldTime)}>
        <Section className="py-10 md:py-16">
          <Grid gapY={32} className="lg:grid-rows-[auto_auto] lg:items-start">
            <Col spanLg={5} className="lg:row-start-1">
              <SectionHeading
                level={1}
                eyebrow={t.nav.academic}
                title={t.academic.title}
                lead={<MathText text={story.lead} />}
                className="mb-0"
              />
            </Col>
            <Col spanLg={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:pl-6">
              <HeatKernelFigure
                labels={{ ...t.academic.figure, caption: undefined }}
                locale={language}
                onTimeChange={setFieldTime}
                describedBy="kernel-notice kernel-caption"
              />
            </Col>
            <Col spanLg={5} className="lg:row-start-2">
              <Notice id="kernel-notice" label={t.academic.noticeLabel}>
                {t.academic.figureNotice}
              </Notice>
              <p id="kernel-caption" className="mt-4 max-w-[48ch] text-sm text-muted-foreground">
                <MathText text={t.academic.figure.caption} />
              </p>
              <nav aria-label={story.contents} className="mt-8">
                <p className="mb-2 font-mono text-meta uppercase tracking-widest text-muted-foreground">
                  {story.contents}
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {contents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="rounded-md text-sm font-medium text-foreground underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-iris"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </Col>
          </Grid>
        </Section>
      </HeatField>

      {/* Established work and its papers, together. The result is the one
          navy surface on the page: the kit's 5% spent where it matters. */}
      <Section id="kernels">
        <SectionHeading
          eyebrow={`${eyebrow(1)} · ${story.kernels.eyebrow}`}
          title={story.kernels.title}
          lead={<MathText text={story.kernels.lead} />}
        />
        <Grid gapY={32} className="mb-12 lg:items-start">
          <Col as={Reveal} spanLg={7}>
            <Card className="border-transparent bg-primary text-primary-foreground">
              <CardContent className="p-6 md:p-8">
                <p className="max-w-[52ch] text-base font-medium leading-relaxed md:text-body-lg">
                  {story.kernels.result}
                </p>
              </CardContent>
            </Card>
          </Col>
          <Col spanLg={5} className="lg:pl-6">
            <p className="max-w-[48ch] text-base text-muted-foreground">{story.kernels.why}</p>
          </Col>
        </Grid>
        {status ??
          (publications.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noPublications} />
          ) : (
            <Reveal>
              <PublicationStack
                publications={publications}
                labels={publicationLabels}
                summaries={t.academic.publicationSummaries}
              />
            </Reveal>
          ))}
      </Section>

      {/* The current investigation: the question first, the figure next, the
          detail after — on a phone in that order top to bottom. */}
      <Section id="transformers" tone="surface">
        <SectionHeading
          eyebrow={`${eyebrow(2)} · ${story.transformers.eyebrow}`}
          title={t.academic.interests.transformers.title}
          lead={story.transformers.question}
        />
        <Grid gapY={32} className="lg:grid-rows-[auto_auto] lg:items-start">
          <Col as={Reveal} spanLg={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <Card tone="lavender">
              <CardContent className="p-6 pb-20 sm:pb-8 md:p-8 md:pb-8">
                <Notice label={t.academic.noticeLabel} className="mb-8">
                  {t.academic.interests.transformers.figure.notice}
                </Notice>
                <CyclicShiftFigure labels={t.academic.interests.transformers.figure} />
                <p className="mt-6 text-base text-foreground">{story.transformers.why}</p>
              </CardContent>
            </Card>
          </Col>
          <Col spanLg={5} className="space-y-5 lg:col-start-1 lg:row-start-1">
            {t.academic.interests.transformers.paragraphs.map((paragraph) => (
              <p key={paragraph} className="max-w-[52ch] text-base text-muted-foreground">
                <MathText text={paragraph} />
              </p>
            ))}
          </Col>
        </Grid>
      </Section>

      {/* A developing interest, smaller and quieter: no panel, a narrower
          figure, and the text says what it is. */}
      <Section id="quantum">
        <SectionHeading
          eyebrow={`${eyebrow(3)} · ${story.quantum.eyebrow}`}
          title={t.academic.interests.quantum.title}
          lead={story.quantum.lead}
        />
        <Grid gapY={32} className="lg:items-start">
          <Col as={Reveal} spanLg={6} className="pb-16 sm:pb-0">
            <Notice label={t.academic.noticeLabel} className="mb-8">
              {t.academic.interests.quantum.figure.notice}
            </Notice>
            <QubitFigure labels={t.academic.interests.quantum.figure} />
          </Col>
          <Col spanLg={5} className="space-y-5 lg:col-start-8">
            {t.academic.interests.quantum.paragraphs.map((paragraph) => (
              <p key={paragraph} className="max-w-[52ch] text-base text-muted-foreground">
                {paragraph}
              </p>
            ))}
            <p className="max-w-[52ch] text-sm text-foreground">{story.quantum.why}</p>
          </Col>
        </Grid>
      </Section>

      {/* The degrees: three steps of one line of research, read left to right,
          the degree as the heading and the prize on its own line. */}
      <Section id="education" tone="surface">
        <SectionHeading eyebrow={eyebrow(4)} title={t.academic.education} />
        {status ??
          (schools.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noData} />
          ) : (
            <Reveal>
              <ResearchThread
                schools={chronological(schools)}
                labels={threadLabels}
                highlights={t.academic.educationHighlights}
              />
            </Reveal>
          ))}
      </Section>

      {/* Teaching: what was taught, from the data; how, in one line of the
          site's own voice; three quotes; and the page's one centred element,
          an invitation to write. */}
      <HeatField>
        <Section id="teaching" className="py-12 md:py-20">
          <SectionHeading
            eyebrow={`${eyebrow(5)} · ${story.teaching.eyebrow}`}
            title={story.teaching.title}
            lead={
              <>
                {teachingIntro && <span className="block">{teachingIntro}</span>}
                <span className="mt-2 block">{story.teaching.approach}</span>
              </>
            }
          />
          {status ??
            (testimonials.length === 0 ? (
              <StatusMessage variant="empty" message={t.academic.noTestimonials} />
            ) : (
              <QuoteWall
                testimonials={testimonials}
                quotes={t.academic.quotes}
                labels={{ showAll: story.teaching.showAll, showFewer: story.teaching.showFewer }}
              />
            ))}
          <Reveal className="mt-20 text-center md:mt-24">
            <h2 className="text-h2-sm md:text-h2">{story.closing.title}</h2>
            <p className="mx-auto mt-4 max-w-[38ch] text-base text-muted-foreground md:text-body-lg">
              {story.closing.body}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a href={`mailto:${EMAIL}`}>
                  <Mail />
                  {story.closing.email}
                </a>
              </Button>
              <Button variant="outline" onClick={() => askVex()}>
                <MessageSquare />
                {t.hero.askAI}
              </Button>
            </div>
          </Reveal>
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Academic;
