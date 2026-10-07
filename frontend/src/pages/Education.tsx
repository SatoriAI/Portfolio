import { useCallback, useEffect, useState } from "react";

import type { DomainKind } from "@/components/academic/DomainGlyph";
import QuoteWall from "@/components/academic/QuoteWall";
import ResearchThread from "@/components/academic/ResearchThread";
import HeaderShapes from "@/components/brand/HeaderShapes";
import HeatField from "@/components/brand/HeatField";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageClosing from "@/components/layout/PageClosing";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import { useSettings } from "@/contexts/SettingsContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { UiSchool, useSchools } from "@/lib/schoolsService";
import { UiTestimonial, useTestimonials } from "@/lib/testimonialsService";
import { translations } from "@/utils/translations";

// The degrees read forward, earliest first: three steps of one line of work.
const chronological = (schools: readonly UiSchool[]) =>
  [...schools].sort((a, b) => a.startDate.localeCompare(b.startDate));

const SECTION_COUNT = 2;
const eyebrow = (index: number) =>
  `${String(index).padStart(2, "0")} / ${String(SECTION_COUNT).padStart(2, "0")}`;

/**
 * The space each degree's work was set on, keyed by its start date: the
 * torus and the interval of the bachelor's thesis, the cone of the master's,
 * the spaces with rotational symmetry of the doctorate.
 */
const DEGREE_DOMAINS: Record<string, DomainKind> = {
  "2016-10-03": "torus-interval",
  "2019-10-03": "cone",
  "2022-10-03": "revolution",
};

/** The degrees, the teaching, and a way to write. */
const Education = () => {
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();
  const t = translations[language];
  const story = t.academic.story;
  usePageMeta(t.meta.education);
  const schoolsService = useSchools();
  const testimonialsService = useTestimonials();

  const loadEducationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [schoolsData, testimonialsData] = await Promise.all([
        schoolsService.fetch(),
        testimonialsService.fetch(),
      ]);
      setSchools(schoolsData);
      setTestimonials(testimonialsData);
    } catch (err) {
      console.error("Failed to fetch education data:", err);
      setError("Failed to load education data");
    } finally {
      setLoading(false);
    }
    // The services close over the current language; that is the only input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    loadEducationData();
  }, [loadEducationData]);

  const threadLabels = {
    advisor: t.academic.advisor,
    researchAreas: t.academic.researchAreas,
    more: t.academic.more,
    less: t.academic.less,
    steps: t.academic.degreeSteps,
    heatHint: t.academic.heatHint,
    newTab: t.academic.newTab,
  };

  // Both lists share one request, so they share one status block.
  const status = loading ? (
    <StatusMessage variant="loading" message={t.common.loading} />
  ) : error ? (
    <StatusMessage
      variant="error"
      message={t.academic.error}
      onRetry={loadEducationData}
      retryLabel={t.academic.tryAgain}
    />
  ) : null;

  return (
    <PageLayout>
      <Section className="relative isolate overflow-hidden md:py-10">
        <HeaderShapes variant="education" />
        <SectionHeading
          level={1}
          eyebrow={t.nav.education}
          title={t.academic.educationTitle}
          leadLine={t.academic.educationLeadLine}
          // mb-0 at every width: the heading's own md:mb-12 would add a gap
          // under the lead that the band's padding already gives.
          className="mb-0 md:mb-0"
        />
      </Section>

      {/* The degrees: one line of research, one degree at a time (the
          bachelor's first), the drawing beside it redrawn as each degree's
          space. */}
      <Section id="education" tone="surface">
        <SectionHeading eyebrow={eyebrow(1)} title={t.academic.education} />
        {status ??
          (schools.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noData} />
          ) : (
            <ResearchThread
              schools={chronological(schools)}
              labels={threadLabels}
              highlights={t.academic.educationHighlights}
              headlines={t.academic.educationHeadlines}
              domains={DEGREE_DOMAINS}
              domainNames={t.academic.domainNames}
            />
          ))}
      </Section>

      {/* Teaching: the idea it rests on, in Feynman's words (paraphrased, and
          credited as such), set off by the iris rule and in italics as the
          site sets words that are not its own; then what students noticed,
          on their own notes (each names its course and term). On the page
          background, as the section after the first white one. */}
      <Section id="teaching" className="py-12 md:py-16">
        <SectionHeading
          eyebrow={eyebrow(2)}
          title={story.teaching.title}
          note={
            <figure className="max-w-[60ch]">
              <blockquote className="text-pretty border-l-2 border-iris pl-5 italic text-foreground">
                {story.teaching.quote}
              </blockquote>
              <figcaption className="mt-2 pl-5 font-mono text-meta">
                — {story.teaching.quoteSource}
              </figcaption>
            </figure>
          }
        />
        {status ??
          (testimonials.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noTestimonials} />
          ) : (
            <QuoteWall
              testimonials={testimonials}
              themes={story.teaching.themes}
              evidence={story.teaching.evidence}
              labels={{ themes: story.teaching.themesLabel }}
            />
          ))}
      </Section>

      {/* How the page ends, as every subpage does, on the colour field. */}
      {/* Pushed to the foot of a short page, so it closes the page right
          above the footer rather than leaving a gap under it. */}
      <HeatField className="mt-auto">
        <Section className="py-12 md:py-20">
          <PageClosing
            title={story.closing.title}
            body={story.closing.body}
            labels={{ email: story.closing.email, askVex: t.hero.askAI }}
            next={{ ...story.closing.next, to: "/workshop" }}
          />
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Education;
