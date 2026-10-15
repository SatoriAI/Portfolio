import type { DomainKind } from "@/components/academic/DomainGlyph";
import QuoteWall from "@/components/academic/QuoteWall";
import ResearchThread from "@/components/academic/ResearchThread";
import HeaderShapes from "@/components/brand/HeaderShapes";
import { queryStatus } from "@/components/feedback/queryStatus";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageClosing from "@/components/layout/PageClosing";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import { useSettings } from "@/contexts/SettingsContext";
import { useSchools, useTestimonials } from "@/lib/queries";
import type { UiSchool } from "@/lib/schoolsService";
import { formatCounter } from "@/lib/text";
import { translations } from "@/utils/translations";

// The degrees read forward, earliest first: three steps of one line of work.
const chronological = (schools: readonly UiSchool[]) =>
  [...schools].sort((a, b) => a.startDate.localeCompare(b.startDate));

const SECTION_COUNT = 2;
const eyebrow = (index: number) => formatCounter(index, SECTION_COUNT);

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
  const { language } = useSettings();
  const t = translations[language];
  const story = t.academic.story;
  const schoolsQuery = useSchools();
  const testimonialsQuery = useTestimonials();
  const schools = schoolsQuery.data ?? [];
  const testimonials = testimonialsQuery.data ?? [];

  const threadLabels = {
    advisor: t.academic.advisor,
    researchAreas: t.academic.researchAreas,
    steps: t.academic.degreeSteps,
    hint: t.academic.degreeHint,
    backToRoad: t.academic.backToRoad,
    newTab: t.academic.newTab,
  };

  // Each list has its own status, so one failing leaves the other standing.
  const statusLabels = {
    loading: t.common.loading,
    error: t.academic.error,
    retry: t.academic.tryAgain,
  };

  return (
    <>
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

      {/* The degrees: one line of research, three stops on a road, each
          under the drawing of its degree's space; choosing one winds the
          road into a row over that degree's card. */}
      <Section id="education" tone="surface">
        {/* Closer over the hint from md, so the whole road fits the first
            screen at 1024x768. */}
        <SectionHeading eyebrow={eyebrow(1)} title={t.academic.education} className="md:mb-6" />
        {queryStatus([schoolsQuery], statusLabels) ??
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
        {queryStatus([testimonialsQuery], statusLabels) ??
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
      <PageClosing copy={story.closing} next={{ ...story.closing.next, to: "/workshop" }} />
    </>
  );
};

export default Education;
