import { useCallback, useEffect, useState } from "react";

import ExperienceCard from "@/components/cards/ExperienceCard";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/contexts/SettingsContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { UiExperience, useExperiences } from "@/lib/experiencesService";
import { translations } from "@/utils/translations";

const staggerMs = (index: number) => Math.min(index, 2) * 60;

const Experience = () => {
  const [experiences, setExperiences] = useState<UiExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();
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

  const labels = {
    keyAchievements: t.experience.keyAchievements,
    technologies: t.experience.technologies,
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
          <div className="space-y-6">
            {experiences.map((experience, index) => (
              <Reveal key={experience.id} delayMs={staggerMs(index)}>
                <ExperienceCard experience={experience} labels={labels} />
              </Reveal>
            ))}
          </div>
        )}
      </Section>
    </PageLayout>
  );
};

export default Experience;
