import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import HeatField from "@/components/brand/HeatField";
import { Col, Grid } from "@/components/layout/Grid";
import PageClosing from "@/components/layout/PageClosing";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import ArticleBody from "@/components/workshop/ArticleBody";
import { EXHIBITS } from "@/components/workshop/exhibitRegistry";
import MetaLine from "@/components/workshop/MetaLine";
import { loadArticleBody, showDrafts, workshopArticles } from "@/content/workshop";
import { useSettings } from "@/contexts/SettingsContext";
import { usePageMeta } from "@/hooks/use-page-meta";
import { cn } from "@/lib/utils";
import { articlesFor, splitSections } from "@/lib/workshop";
import NotFound from "@/pages/NotFound";
import { translations } from "@/utils/translations";

/** Two digits, as the section numbers are elsewhere on the site. */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One piece from the workshop, set as a test log. The head: the date,
 * reading time and topics on one mono line, the title, the summary a step
 * above the text, then the piece's own evidence in a card with its caption,
 * so the result comes before the story. Then the text in sections, each
 * section's heading standing in the margin beside it (numbered, under the
 * piece's own word for a section if it gives one, e.g. "Próba"), held in
 * view while its section is read; the section being read lights in iris.
 * The text keeps one reading column (columns 4–10, 55–70 characters a
 * line), the head on the same edge; on a phone each heading sits over its section. It ends on the
 * shared closing, which carries the way on to the page the piece belongs
 * with. The floating chat button stands aside while the text is in view.
 */
const WorkshopArticle = () => {
  const { slug } = useParams();
  const { language } = useSettings();
  const t = translations[language];
  const w = t.workshop;
  const articleRef = useRef<HTMLDivElement>(null);
  const article = articlesFor(workshopArticles, language, { drafts: showDrafts }).find(
    (piece) => piece.slug === slug,
  );
  usePageMeta(
    article
      ? { title: `${article.title} · Dawid Hanrahan`, description: article.summary }
      : t.meta.workshop,
  );

  // The text is its own chunk, fetched once per piece and language; the head
  // stands while it arrives.
  const { data: body } = useQuery({
    queryKey: ["workshop-text", article?.slug, article?.language],
    queryFn: () => loadArticleBody(article!),
    enabled: article !== undefined,
  });
  const sections = useMemo(() => (body ? splitSections(body) : []), [body]);

  // The section being read: the last one whose top has passed a third of
  // the way down the screen. Colour only; nothing moves. Measured at most
  // once a frame, however often the scroll fires.
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const element = articleRef.current;
    if (!element) return;
    const parts = [...element.querySelectorAll<HTMLElement>("[data-section]")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let at = 0;
      parts.forEach((part, index) => {
        if (part.getBoundingClientRect().top <= line) at = index;
      });
      setCurrent(at);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sections]);

  if (!article) return <NotFound />;
  const relatedName = article.related ? w.pages[article.related] : undefined;
  // The figure opens the piece only when the piece asks for it; otherwise
  // the text sets it where it belongs (`/figure/<name>` images).
  const exhibit = article.showcase && article.figure ? EXHIBITS[article.figure] : undefined;
  const bodyLabels = {
    copy: w.copy,
    copied: w.copied,
    footnotes: w.footnotes,
    backToText: w.backToText,
  };
  let numbered = 0;

  return (
    <PageLayout launcherClearOf={articleRef}>
      <Section className="md:py-10">
        {/* The chat button stands aside over all of this, the evidence card included. */}
        <div ref={articleRef}>
          <Grid gapY={24}>
            <Col spanLg={3}>
              <Link
                to="/workshop"
                className="inline-flex w-fit items-center gap-1.5 rounded-sm font-mono text-meta text-iris underline decoration-1 underline-offset-4 outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:mt-1"
              >
                <ArrowLeft aria-hidden="true" className="size-3.5" />
                {w.all}
              </Link>
            </Col>
            <Col spanMd={10} spanLg={7} className="flex flex-col">
              {/* On a phone the title comes first and the details under it. */}
              <div className="order-3 mt-4 lg:order-1 lg:mb-4 lg:mt-0">
                <MetaLine
                  date={article.date}
                  locale={language}
                  minutes={w.minutes.replace("{n}", String(article.minutes))}
                  tags={article.tags}
                  tagsLabel={w.tags}
                />
                {article.inOtherLanguage && (
                  <p className="mt-1 font-mono text-meta text-muted-foreground">
                    {w.onlyInLong[article.language]}
                  </p>
                )}
              </div>
              <h1 className="order-1 text-balance break-words text-h2-sm md:text-h2 lg:order-2">
                {article.title}
              </h1>
              {article.summary && (
                <p className="order-2 mt-4 break-words text-xl text-muted-foreground md:text-2xl md:leading-[2.375rem] lg:order-3">
                  {article.summary}
                </p>
              )}
            </Col>
            {exhibit && (
              // The result before the story: the piece's evidence, its caption beside it.
              <Col spanMd={10} spanLg={7} className="lg:col-start-4">
                <figure className="grid gap-6 rounded-card border border-border bg-card p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
                  <div className="min-w-0">{exhibit(w.figure)}</div>
                  {article.caption && (
                    <figcaption className="text-base text-muted-foreground">
                      {article.caption}
                    </figcaption>
                  )}
                </figure>
              </Col>
            )}
          </Grid>

          <article lang={article.language} className="mt-12 md:mt-16">
            {sections.map((section, index) => {
              const number = section.heading ? ++numbered : 0;
              const lit = index === current;
              return (
                <Grid
                  key={index}
                  data-section
                  className="group mb-8 md:mb-12"
                  data-current={lit ? "true" : "false"}
                >
                  <Col spanLg={3}>
                    <div
                      className={cn(
                        "border-l-2 pl-4 transition-colors duration-200 motion-reduce:transition-none lg:sticky lg:top-28",
                        lit ? "border-iris" : "border-border",
                      )}
                    >
                      <p
                        aria-hidden="true"
                        className={cn(
                          "font-mono text-meta uppercase tracking-widest transition-colors duration-200 motion-reduce:transition-none",
                          lit ? "text-iris" : "text-muted-foreground",
                        )}
                      >
                        {section.heading
                          ? [article.stamp, pad(number)].filter(Boolean).join(" ")
                          : w.introduction}
                      </p>
                      {section.heading && (
                        <h2 className="mt-1 text-balance text-xl font-semibold leading-[1.8125rem] tracking-[-0.02em] lg:text-[1.375rem]">
                          {section.heading}
                        </h2>
                      )}
                    </div>
                  </Col>
                  <Col spanMd={10} spanLg={7}>
                    <ArticleBody
                      markdown={section.body}
                      labels={bodyLabels}
                      figureLabels={w.figure}
                      language={article.language}
                    />
                  </Col>
                </Grid>
              );
            })}
          </article>
        </div>
      </Section>

      {/* Pushed to the foot of a short page, so it closes the page right
          above the footer rather than leaving a gap under it. */}
      <HeatField className="mt-auto">
        <Section className="py-12 md:py-20">
          <PageClosing
            split={4}
            subject={article.title}
            title={w.articleClosing.title}
            body={w.articleClosing.body}
            labels={{ email: w.articleClosing.email, askVex: t.hero.askAI }}
            next={
              article.related && relatedName
                ? { lead: w.related, label: relatedName, to: article.related }
                : { lead: w.related, label: w.all, to: "/workshop" }
            }
          />
        </Section>
      </HeatField>
    </PageLayout>
  );
};

export default WorkshopArticle;
