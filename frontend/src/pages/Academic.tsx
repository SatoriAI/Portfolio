import { useCallback, useEffect, useState } from "react";

import PublicationCard from "@/components/cards/PublicationCard";
import SchoolCard from "@/components/cards/SchoolCard";
import TestimonialCard from "@/components/cards/TestimonialCard";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import SwipeCarousel from "@/components/SwipeCarousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSettings } from "@/contexts/SettingsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageMeta } from "@/hooks/use-page-meta";
import { UiPublication, usePublications } from "@/lib/publicationsService";
import { UiSchool, useSchools } from "@/lib/schoolsService";
import { UiTestimonial, useTestimonials } from "@/lib/testimonialsService";
import { translations } from "@/utils/translations";

const staggerMs = (index: number) => Math.min(index, 2) * 60;

const Academic = () => {
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [publications, setPublications] = useState<UiPublication[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();
  const t = translations[language];
  const isMobile = useIsMobile();
  usePageMeta(t.meta.research);
  const schoolsService = useSchools();
  const publicationsService = usePublications();
  const testimonialsService = useTestimonials();

  const loadAcademicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load schools, publications, and testimonials in parallel
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

  const schoolLabels = {
    researchFocus: t.academic.researchFocus,
    advisor: t.academic.advisor,
    researchAreas: t.academic.researchAreas,
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
        <SectionHeading
          level={1}
          eyebrow={t.nav.academic}
          title={t.academic.title}
          lead={t.academic.subtitle}
        />
        {status ??
          (schools.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noData} />
          ) : (
            <div className="space-y-6">
              {schools.map((school, index) => (
                <Reveal key={school.id} delayMs={staggerMs(index)}>
                  <SchoolCard school={school} labels={schoolLabels} />
                </Reveal>
              ))}
            </div>
          ))}
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
            <div className="space-y-6">
              {publications.map((publication, index) => (
                <Reveal key={publication.id} delayMs={staggerMs(index)}>
                  <PublicationCard publication={publication} labels={publicationLabels} />
                </Reveal>
              ))}
            </div>
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
          ) : isMobile ? (
            <SwipeCarousel
              items={testimonials}
              getKey={(testimonial) => testimonial.id}
              storageKey="swipeHintSeen.testimonials"
              hintText={t.hints.swipeMore}
              renderItem={(testimonial) => <TestimonialCard testimonial={testimonial} />}
            />
          ) : (
            <Reveal className="px-12">
              <Carousel opts={{ align: "start", watchDrag: false }}>
                <CarouselContent>
                  {testimonials.map((testimonial) => (
                    <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                      <TestimonialCard testimonial={testimonial} className="h-full" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </Reveal>
          ))}
      </Section>
    </PageLayout>
  );
};

export default Academic;
