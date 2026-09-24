import { useCallback, useEffect, useState } from "react";

import CareerTimeline from "@/components/experience/CareerTimeline";
import RoleEntry from "@/components/experience/RoleEntry";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/contexts/SettingsContext";
import { useVex } from "@/contexts/VexContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { UiExperience, useExperiences } from "@/lib/experiencesService";
import { translations } from "@/utils/translations";

/**
 * The career, first as a drawing to scale and then as entries. The timeline
 * is what a stack of cards could never show: how long each role ran and which
 * ones ran together. Each line links to its entry.
 */
const Experience = () => {
  const [experiences, setExperiences] = useState<UiExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();
  const { askVex } = useVex();
  const t = translations[language];
  usePageMeta(t.meta.experience);
  const experiencesService = useExperiences();

  const loadExperiences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await experiencesService.fetch();
      setExperiences(data);
    } catch (err) {
      console.error("Failed to fetch experiences:", err);
      setError("Failed to load work experience data");
    } finally {
      setLoading(false);
    }
    // The service closes over the current language; that is the only input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  const entryLabels = {
    keyAchievements: t.experience.keyAchievements,
    technologies: t.experience.technologies,
    askVex: t.experience.askVex,
    askVexQuestion: t.experience.askVexQuestion,
  };
  const timelineLabels = {
    figure: t.experience.timeline.figure,
    caption: t.experience.timeline.caption,
    now: t.experience.timeline.now,
  };

  return (
    <PageLayout>
      <Section>
        <SectionHeading
          level={1}
          eyebrow={t.nav.experience}
          title={t.experience.title}
          lead={t.experience.subtitle}
        />

        {loading ? (
          <StatusMessage variant="loading" message={t.common.loading} />
        ) : error ? (
          <StatusMessage
            variant="error"
            message={t.experience.error}
            onRetry={loadExperiences}
            retryLabel={t.experience.tryAgain}
          />
        ) : experiences.length === 0 ? (
          <StatusMessage variant="empty" message={t.experience.noData} />
        ) : (
          <>
            <Reveal className="mb-16 md:mb-20">
              <CareerTimeline experiences={experiences} labels={timelineLabels} />
            </Reveal>
            <div className="border-b border-border">
              {experiences.map((experience) => (
                <Reveal key={experience.id}>
                  <RoleEntry experience={experience} labels={entryLabels} onAsk={askVex} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </Section>
    </PageLayout>
  );
};

export default Experience;
