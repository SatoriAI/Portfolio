import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { EXHIBITS } from "@/components/workshop/exhibitRegistry";
import type { ExhibitLabels } from "@/components/workshop/exhibits";
import MetaLine from "@/components/workshop/MetaLine";
import type { ShownArticle, WorkshopLanguage } from "@/lib/workshop";

/**
 * The workshop's index: a full-width row per piece, its evidence beside its
 * text, so each piece shows what it found before it is opened. The text
 * holds its details line (see MetaLine), the title (the row's one link),
 * then the summary. Pointing at or focusing a
 * row lights the mark in its exhibit that carries the result. A piece with
 * no exhibit keeps the text alone, across the row.
 */

export type WorkshopIndexLabels = {
  /** Reading time; `{n}` is replaced. */
  minutes: string;
  onlyIn: Record<WorkshopLanguage, string>;
  tags: string;
  exhibit: ExhibitLabels;
};

type WorkshopIndexProps = {
  articles: readonly ShownArticle[];
  locale: string;
  labels: WorkshopIndexLabels;
};

const WorkshopIndex = ({ articles, locale, labels }: WorkshopIndexProps) => (
  <ol className="border-t border-border">
    {articles.map((article) => {
      const exhibit = article.figure ? EXHIBITS[article.figure] : undefined;
      return (
        <li
          key={article.slug}
          className="group/piece grid grid-cols-4 gap-x-6 gap-y-6 border-b border-border py-8 md:grid-cols-12 lg:py-10"
        >
          {/* With no exhibit the text takes the whole row rather than leaving its columns empty. */}
          <div
            className={
              exhibit
                ? "col-span-4 md:col-span-12 lg:col-span-7 lg:col-start-6"
                : "col-span-4 md:col-span-12 lg:col-span-8"
            }
          >
            <MetaLine
              date={article.date}
              locale={locale}
              minutes={labels.minutes.replace("{n}", String(article.minutes))}
              tags={article.tags}
              tagsLabel={labels.tags}
            />
            <h2 className="mt-2 text-balance text-card-title-sm font-semibold md:text-card-title">
              <Link
                to={`/workshop/${article.slug}`}
                className="rounded-sm text-foreground underline-offset-4 outline-none transition-colors duration-200 hover:text-iris hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group-focus-within/piece:text-iris group-hover/piece:text-iris"
              >
                {article.title.slice(0, article.title.lastIndexOf(" ") + 1)}
                <span className="whitespace-nowrap">
                  {article.title.slice(article.title.lastIndexOf(" ") + 1)}
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-2 inline size-5 -translate-y-px align-middle text-iris transition-transform duration-200 group-hover/piece:translate-x-0.5 md:size-[22px]"
                  />
                </span>
              </Link>
            </h2>
            {article.summary && (
              <p className="mt-2 text-base text-muted-foreground md:text-body-lg">
                {article.summary}
              </p>
            )}
            {article.inOtherLanguage && (
              <p className="mt-3 font-mono text-meta text-muted-foreground">
                {labels.onlyIn[article.language]}
              </p>
            )}
          </div>
          {exhibit && (
            // Beside the text from lg; under it, full width, below.
            <div className="col-span-4 md:col-span-12 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:self-center">
              {exhibit(labels.exhibit)}
            </div>
          )}
        </li>
      );
    })}
  </ol>
);

export default WorkshopIndex;
