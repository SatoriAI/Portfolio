import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { queryStatus } from "@/components/feedback/queryStatus";
import { Col, Grid } from "@/components/layout/Grid";
import PageClosing from "@/components/layout/PageClosing";
import Section from "@/components/layout/Section";
import ArticleBody from "@/components/workshop/ArticleBody";
import { EXHIBITS } from "@/components/workshop/exhibitRegistry";
import MetaLine from "@/components/workshop/MetaLine";
import { showDrafts, workshopArticles } from "@/content/workshop";
import { useSettings } from "@/contexts/SettingsContext";
import { useLauncherAside } from "@/hooks/use-launcher-aside";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { useArticleText } from "@/lib/queries";
import { fillTemplate, pad2 } from "@/lib/text";
import { cn } from "@/lib/utils";
import { articlesFor, splitSections } from "@/lib/workshop";
import NotFound from "@/pages/NotFound";
import { translations } from "@/utils/translations";

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
  const articleRef = useRef<HTMLDivElement | null>(null);
  // The chat button stands aside over the text (see PageLayout).
  const asideRef = useLauncherAside();
  const setArticle = useCallback(
    (element: HTMLDivElement | null) => {
      articleRef.current = element;
      asideRef(element);
    },
    [asideRef],
  );
  const article = articlesFor(workshopArticles, language, { drafts: showDrafts }).find(
    (piece) => piece.slug === slug,
  );
  usePageMeta(
    article
      ? { title: `${article.title} · Dawid Hanrahan`, description: article.summary }
      : t.meta.workshop,
  );

  const text = useArticleText(article);
  const sections = useMemo(() => (text.data ? splitSections(text.data) : []), [text.data]);

  // The section being read: the last one whose top has passed a third of
  // the way down the screen. Colour only; nothing moves.
  const [current, setCurrent] = useState(0);
  useScrollFrame(
    () => {
      const parts = articleRef.current?.querySelectorAll<HTMLElement>("[data-section]") ?? [];
      const line = window.innerHeight / 3;
      let at = 0;
      parts.forEach((part, index) => {
        if (part.getBoundingClientRect().top <= line) at = index;
      });
      setCurrent(at);
    },
    { watch: sections },
  );

  // Stable, so the memoised body is not rebuilt as the section being read changes.
  const bodyLabels = useMemo(
    () => ({ copy: w.copy, copied: w.copied, footnotes: w.footnotes, backToText: w.backToText }),
    [w],
  );

  if (!article) return <NotFound />;
  const relatedName = article.related ? w.pages[article.related] : undefined;
  // The figure opens the piece only when the piece asks for it; otherwise
  // the text sets it where it belongs (`/figure/<name>` images).
  const exhibit = article.showcase && article.figure ? EXHIBITS[article.figure] : undefined;
  let numbered = 0;

  return (
    <>
      <Section className="md:py-10">
        {/* The chat button stands aside over all of this, the evidence card included. */}
        <div ref={setArticle}>
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
                  minutes={fillTemplate(w.minutes, { n: article.minutes })}
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

          {/* The head stands while the text arrives. */}
          {queryStatus([text], {
            loading: t.common.loading,
            error: w.textError,
            retry: w.tryAgain,
          })}
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
                          ? [article.stamp, pad2(number)].filter(Boolean).join(" ")
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

      <PageClosing
        split={4}
        subject={article.title}
        copy={w.articleClosing}
        next={
          article.related && relatedName
            ? { lead: w.related, label: relatedName, to: article.related }
            : { lead: w.related, label: w.all, to: "/workshop" }
        }
      />
    </>
  );
};

export default WorkshopArticle;
