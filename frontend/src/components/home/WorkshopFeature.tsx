import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Col, Grid } from "@/components/layout/Grid";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { EXHIBITS } from "@/components/workshop/exhibitRegistry";
import type { ExhibitLabels } from "@/components/workshop/exhibits";
import TypedText from "@/components/workshop/TypedText";
import { cn } from "@/lib/utils";
import { formatDate, type ShownArticle } from "@/lib/workshop";

/**
 * The workshop on the home page, in its own form rather than a copy of the
 * workshop's list: the newest piece as a card (the whole card is the link)
 * with its small still figure, its date, its title
 * typing itself out once, its summary and reading time; beside it, under the
 * heading, the next pieces as hairline rows and the way to all of them. On a
 * phone the card comes straight after the heading, as it does in the code.
 */

export type WorkshopFeatureLabels = {
  eyebrow: string;
  title: string;
  lead: string;
  all: string;
  /** Reading time; `{n}` is replaced. */
  minutes: string;
  figure: ExhibitLabels;
};

const META = "font-mono text-meta uppercase tracking-widest text-iris";

const Arrow = ({ className }: { className?: string }) => (
  <ArrowRight
    aria-hidden="true"
    className={cn(
      "ml-2 inline -translate-y-px align-middle text-iris transition-transform duration-200 group-hover:translate-x-0.5",
      className,
    )}
  />
);

/** "1 PAŹDZIERNIKA 2026": when the piece was published. */
const Meta = ({ article, locale }: { article: ShownArticle; locale: string }) => (
  <p className={META}>
    <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
  </p>
);

type WorkshopFeatureProps = {
  /** Newest first; the first is the card, the next two are rows. */
  articles: readonly ShownArticle[];
  locale: string;
  labels: WorkshopFeatureLabels;
};

const WorkshopFeature = ({ articles, locale, labels }: WorkshopFeatureProps) => {
  const [newest, ...older] = articles;
  if (!newest) return null;
  const figure = newest.figure ? EXHIBITS[newest.figure] : undefined;

  // Three blocks in reading order (heading, the newest piece, the rest), so
  // the keyboard and a screen reader meet them as they are seen. From lg the
  // card takes the right-hand columns across both rows.
  return (
    <Grid gapY={32} className="lg:grid-rows-[auto_1fr]">
      <Col spanLg={5}>
        <SectionHeading
          eyebrow={labels.eyebrow}
          title={labels.title}
          leadLine={labels.lead}
          className="mb-0 md:mb-0"
        />
      </Col>

      <Col as={Reveal} spanLg={7} className="lg:col-start-6 lg:row-span-2 lg:row-start-1">
        {/* The whole card is the link, so it lifts on hover, as the kit
            allows only for wholly actionable cards. */}
        <Link
          to={`/workshop/${newest.slug}`}
          className="group block rounded-card border border-border bg-card p-6 outline-none transition-shadow duration-200 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-8 lg:h-full"
        >
          {figure && <div className="mb-6">{figure(labels.figure)}</div>}
          <Meta article={newest} locale={locale} />
          <h3 className="mt-2 text-balance text-card-title-sm font-semibold text-foreground md:text-card-title">
            <TypedText text={newest.title} after={<Arrow className="size-5 md:size-[22px]" />} />
          </h3>
          {newest.summary && (
            <p className="mt-2 text-base text-muted-foreground">{newest.summary}</p>
          )}
          <p className="mt-3 font-mono text-meta text-muted-foreground">
            {labels.minutes.replace("{n}", String(newest.minutes))}
          </p>
        </Link>
      </Col>

      <Col as={Reveal} spanLg={5} className="lg:row-start-2">
        {older.length > 0 && (
          <ol className="mb-8 border-t border-border">
            {older.map((article) => {
              const at = article.title.lastIndexOf(" ") + 1;
              return (
                <li key={article.slug} className="border-b border-border py-5">
                  <Meta article={article} locale={locale} />
                  <h3 className="mt-2 text-lg font-semibold">
                    <Link
                      to={`/workshop/${article.slug}`}
                      className="group rounded-sm text-foreground underline-offset-4 outline-none transition-colors duration-200 hover:text-iris hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {/* The arrow keeps to the title's last word. */}
                      {article.title.slice(0, at)}
                      <span className="whitespace-nowrap">
                        {article.title.slice(at)}
                        <Arrow className="size-4" />
                      </span>
                    </Link>
                  </h3>
                </li>
              );
            })}
          </ol>
        )}
        <Link
          to="/workshop"
          className="group -my-3 inline-flex items-center gap-1.5 py-3 font-mono text-meta text-iris underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-foreground"
        >
          {labels.all}
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </Col>
    </Grid>
  );
};

export default WorkshopFeature;
