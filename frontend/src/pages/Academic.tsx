import { useCallback, useEffect, useState } from "react";

import HeatKernelFigure from "@/components/academic/HeatKernelFigure";
import PublicationEntry from "@/components/academic/PublicationEntry";
import QuoteWall from "@/components/academic/QuoteWall";
import ResearchThread from "@/components/academic/ResearchThread";
import StatusMessage from "@/components/feedback/StatusMessage";
import { Col, Grid } from "@/components/layout/Grid";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
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
 * Research and teaching. The page opens beside a figure of the object the
 * research is about — a heat kernel, drawn from its series — then reads the
 * three degrees as one thread, the two papers as entries, and the students'
 * words all at once.
 */
const Academic = () => {
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [publications, setPublications] = useState<UiPublication[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    inProgress: t.academic.inProgress,
  };
  const publicationLabels = { view: t.academic.view };

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
      <Section>
        <Grid gapY={48} className="lg:items-start">
          <Col spanLg={7}>
            <SectionHeading
              level={1}
              eyebrow={t.nav.academic}
              title={t.academic.title}
              lead={t.academic.subtitle}
              className="mb-0"
            />
          </Col>
          <Col as={Reveal} spanLg={5}>
            <HeatKernelFigure labels={t.academic.figure} locale={language} />
          </Col>
        </Grid>
        <div className="mt-16 md:mt-20">
          {status ??
            (schools.length === 0 ? (
              <StatusMessage variant="empty" message={t.academic.noData} />
            ) : (
              <Reveal>
                <ResearchThread schools={chronological(schools)} labels={threadLabels} />
              </Reveal>
            ))}
        </div>
      </Section>

      <Section id="publications">
        <SectionHeading
          eyebrow={`01 / ${t.academic.publications}`}
          title={t.academic.publications}
        />
        {status ??
          (publications.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noPublications} />
          ) : (
            <Grid gapY={32}>
              {publications.map((publication, index) => (
                <Col as={Reveal} key={publication.id} spanMd={6} delayMs={Math.min(index, 2) * 60}>
                  <PublicationEntry publication={publication} labels={publicationLabels} />
                </Col>
              ))}
            </Grid>
          ))}
      </Section>

      <Section id="testimonials">
        <SectionHeading
          eyebrow={`02 / ${t.academic.studentTestimonials}`}
          title={t.academic.studentTestimonials}
        />
        {status ??
          (testimonials.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noTestimonials} />
          ) : (
            <QuoteWall testimonials={testimonials} quotes={t.academic.quotes} />
          ))}
      </Section>
    </PageLayout>
  );
};

export default Academic;
