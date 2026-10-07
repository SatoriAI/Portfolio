import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Col, Grid } from "@/components/layout/Grid";
import SectionHeading from "@/components/layout/SectionHeading";
import Reveal from "@/components/Reveal";
import { EXHIBITS } from "@/components/workshop/exhibitRegistry";
import type { ExhibitLabels } from "@/components/workshop/exhibits";
import KeepWithLastWord, { TitleArrow } from "@/components/workshop/KeepWithLastWord";
import MetaLine from "@/components/workshop/MetaLine";
import TypedText from "@/components/workshop/TypedText";
import { fillTemplate } from "@/lib/text";
import type { ShownArticle } from "@/lib/workshop";

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
          <MetaLine date={newest.date} locale={locale} />
          <h3 className="mt-2 text-balance text-card-title-sm font-semibold text-foreground md:text-card-title">
            <TypedText
              text={newest.title}
              after={<TitleArrow className="size-5 group-hover:translate-x-0.5 md:size-[22px]" />}
            />
          </h3>
          {newest.summary && (
            <p className="mt-2 text-base text-muted-foreground">{newest.summary}</p>
          )}
          <p className="mt-3 font-mono text-meta text-muted-foreground">
            {fillTemplate(labels.minutes, { n: newest.minutes })}
          </p>
        </Link>
      </Col>

      <Col as={Reveal} spanLg={5} className="lg:row-start-2">
        {older.length > 0 && (
          <ol className="mb-8 border-t border-border">
            {older.map((article) => (
              <li key={article.slug} className="border-b border-border py-5">
                <MetaLine date={article.date} locale={locale} />
                <h3 className="mt-2 text-lg font-semibold">
                  <Link
                    to={`/workshop/${article.slug}`}
                    className="group rounded-sm text-foreground underline-offset-4 outline-none transition-colors duration-200 hover:text-iris hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <KeepWithLastWord text={article.title}>
                      <TitleArrow className="size-4 group-hover:translate-x-0.5" />
                    </KeepWithLastWord>
                  </Link>
                </h3>
              </li>
            ))}
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
