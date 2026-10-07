import HeaderShapes from "@/components/brand/HeaderShapes";
import HeatField from "@/components/brand/HeatField";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageClosing from "@/components/layout/PageClosing";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import WorkshopIndex from "@/components/workshop/WorkshopIndex";
import { showDrafts, workshopArticles } from "@/content/workshop";
import { useSettings } from "@/contexts/SettingsContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { articlesFor } from "@/lib/workshop";
import { translations } from "@/utils/translations";

/**
 * Every piece from the workshop, newest first: the heading with the lead
 * beside it, then a row per piece with its evidence beside its text (see
 * WorkshopIndex), then the shared closing.
 */
const Workshop = () => {
  const { language } = useSettings();
  const t = translations[language];
  const w = t.workshop;
  usePageMeta(t.meta.workshop);

  const articles = articlesFor(workshopArticles, language, { drafts: showDrafts });
  const indexLabels = {
    minutes: w.minutes,
    onlyIn: w.onlyIn,
    tags: w.tags,
    exhibit: w.figure,
  };

  return (
    <PageLayout>
      {/* The header as every subpage opens: alone on the page background,
          over its own drawing, here a sheet from the bench. */}
      <Section className="relative isolate overflow-hidden md:py-10">
        <HeaderShapes variant="workshop" />
        <SectionHeading
          level={1}
          eyebrow={t.nav.workshop}
          title={w.headline}
          leadLine={w.lead}
          className="mb-0 md:mb-0"
        />
      </Section>

      <Section tone="surface">
        {articles.length === 0 ? (
          <StatusMessage variant="empty" message={w.empty} />
        ) : (
          <WorkshopIndex articles={articles} locale={language} labels={indexLabels} />
        )}
      </Section>

      {/* Pushed to the foot of a short page, so it closes the page right
          above the footer rather than leaving a gap under it. */}
      <HeatField className="mt-auto">
        <Section className="py-12 md:py-20">
          <PageClosing
            title={w.closing.title}
            body={w.closing.body}
            labels={{ email: w.closing.email, askVex: t.hero.askAI }}
          />
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default Workshop;
