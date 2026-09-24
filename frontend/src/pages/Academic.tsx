import { useCallback, useEffect, useState } from "react";

import CyclicShiftFigure from "@/components/academic/CyclicShiftFigure";
import HeatKernelFigure from "@/components/academic/HeatKernelFigure";
import PublicationStack from "@/components/academic/PublicationStack";
import QubitFigure from "@/components/academic/QubitFigure";
import QuoteWall from "@/components/academic/QuoteWall";
import ResearchThread from "@/components/academic/ResearchThread";
import HeatField from "@/components/brand/HeatField";
import StatusMessage from "@/components/feedback/StatusMessage";
import { Col, Grid } from "@/components/layout/Grid";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { UiPublication, usePublications } from "@/lib/publicationsService";
import { UiSchool, useSchools } from "@/lib/schoolsService";
import { UiTestimonial, useTestimonials } from "@/lib/testimonialsService";
import { translations } from "@/utils/translations";

// The degrees read forward, earliest first: three steps of one line of work.
const chronological = (schools: readonly UiSchool[]) =>
  [...schools].sort((a, b) => a.startDate.localeCompare(b.startDate));

/**
 * The kernel figure's t runs 0.01–2; the field's time is in units of its
 * resting spread, so t = 2 is the field at rest and small t is heat still
 * gathered at the sources.
 */
const fieldTimeFor = (t: number) => t / 2;

const SECTION_COUNT = 4;
const eyebrow = (index: number) =>
  `${String(index).padStart(2, "0")} / ${String(SECTION_COUNT).padStart(2, "0")}`;

/**
 * Research and teaching. The page opens on a heat kernel the visitor can run,
 * with the same equation spreading through the field behind the title; then
 * the current questions with their own interactive figures, the three degrees
 * as one thread, the two papers with their domains drawn, and the students'
 * words on the field at rest.
 */
const Academic = () => {
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [publications, setPublications] = useState<UiPublication[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldTime, setFieldTime] = useState(1);
  const { language } = useSettings();
  const t = translations[language];
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
  };
  const publicationLabels = {
    view: t.academic.view,
    stack: t.academic.stack,
    venue: t.academic.venue,
    year: t.academic.year,
  };

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
          it, so dragging t spreads the heat behind the title too. */}
      <HeatField placement="top" time={fieldTimeFor(fieldTime)}>
        <Section className="pb-12 pt-12 md:pb-16 md:pt-20">
          <Grid gapY={48} className="lg:items-start">
            <Col spanLg={5}>
              <SectionHeading
                level={1}
                eyebrow={t.nav.academic}
                title={t.academic.title}
                lead={t.academic.subtitle}
                className="mb-0"
              />
            </Col>
            <Col spanLg={7} className="lg:pl-6">
              <HeatKernelFigure
                labels={{ ...t.academic.figure, lead: t.academic.figureNotice }}
                locale={language}
                onTimeChange={setFieldTime}
              />
            </Col>
          </Grid>
        </Section>
      </HeatField>

      {/* Current work first, so the page opens on a live question rather than
          a history. Each topic faces a figure that is the object itself rather
          than a picture of it, on a lavender panel — the kit's surface for a
          visualisation — with one plain sentence on what to notice before the
          formal caption. The two alternate sides. */}
      <Section id="interests">
        <SectionHeading eyebrow={eyebrow(1)} title={t.academic.interests.title} />
        <div className="space-y-20 md:space-y-24">
          <Grid gapY={48} className="lg:items-start">
            <Col spanLg={5} className="space-y-5">
              <h3 className="text-card-title-sm font-semibold md:text-card-title">
                {t.academic.interests.transformers.title}
              </h3>
              {t.academic.interests.transformers.paragraphs.map((paragraph) => (
                <p key={paragraph} className="max-w-[52ch] text-base text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </Col>
            <Col as={Reveal} spanLg={7}>
              <Card tone="lavender">
                <CardContent className="p-6 md:p-8">
                  <p className="mb-6 text-base text-foreground">
                    {t.academic.interests.transformers.figure.notice}
                  </p>
                  <CyclicShiftFigure labels={t.academic.interests.transformers.figure} />
                </CardContent>
              </Card>
            </Col>
          </Grid>
          <Grid gapY={48} className="lg:items-start">
            <Col spanLg={5} className="space-y-5 lg:order-last">
              <h3 className="text-card-title-sm font-semibold md:text-card-title">
                {t.academic.interests.quantum.title}
              </h3>
              {t.academic.interests.quantum.paragraphs.map((paragraph) => (
                <p key={paragraph} className="max-w-[52ch] text-base text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </Col>
            <Col as={Reveal} spanLg={7}>
              <Card tone="lavender">
                <CardContent className="p-6 md:p-8">
                  <p className="mb-6 text-base text-foreground">
                    {t.academic.interests.quantum.figure.notice}
                  </p>
                  <QubitFigure labels={t.academic.interests.quantum.figure} />
                </CardContent>
              </Card>
            </Col>
          </Grid>
        </div>
      </Section>

      {/* The degrees, on a white band after the current work: three steps of
          one line of research, read left to right. */}
      <Section id="education" tone="surface">
        <SectionHeading eyebrow={eyebrow(2)} title={t.academic.education} />
        {status ??
          (schools.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noData} />
          ) : (
            <Reveal>
              <ResearchThread schools={chronological(schools)} labels={threadLabels} />
            </Reveal>
          ))}
      </Section>

      <Section id="publications">
        <SectionHeading
          eyebrow={eyebrow(3)}
          title={t.academic.publications}
          lead={t.academic.publicationsLead}
        />
        {status ??
          (publications.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noPublications} />
          ) : (
            <Reveal>
              <PublicationStack publications={publications} labels={publicationLabels} />
            </Reveal>
          ))}
      </Section>

      {/* The students' words close the page on the field at rest, the same
          bookend the home page uses. */}
      <HeatField>
        <Section id="testimonials" className="py-12 md:py-20">
          <SectionHeading eyebrow={eyebrow(4)} title={t.academic.studentTestimonials} />
          {status ??
            (testimonials.length === 0 ? (
              <StatusMessage variant="empty" message={t.academic.noTestimonials} />
            ) : (
              <QuoteWall testimonials={testimonials} quotes={t.academic.quotes} />
            ))}
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Academic;
