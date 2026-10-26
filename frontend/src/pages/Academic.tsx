import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import PublicationStack from "@/components/academic/PublicationStack";
import HeaderShapes from "@/components/brand/HeaderShapes";
import { queryStatus } from "@/components/feedback/queryStatus";
import StatusMessage from "@/components/feedback/StatusMessage";
import PageClosing from "@/components/layout/PageClosing";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import { LINK } from "@/components/research/prose";
import ThreadGlimpse from "@/components/research/ThreadGlimpse";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/contexts/SettingsContext";
import type { UiPublication } from "@/lib/publicationsService";
import { usePublications } from "@/lib/queries";
import { RESEARCH_THREADS, threadCopy, threadForAnchor } from "@/lib/researchThreads";
import { fillTemplate, formatCounter } from "@/lib/text";
import { translations } from "@/utils/translations";

/** The index's two sections: the threads, then the papers. */
const SECTION_COUNT = 2;
const eyebrow = (index: number) => formatCounter(index, SECTION_COUNT);

/**
 * Research, as an index: one row per thread, each opening the thread's own
 * page, then the papers. The rows are read down one column, a still glimpse
 * of the thread's figure beside its status, title and question; the header
 * names how many papers there are and jumps to them, so the record is never
 * behind a long scroll. The degrees and the teaching have a page of their own.
 */
const Academic = () => {
  const { language } = useSettings();
  const t = translations[language];
  const story = t.academic.story;
  const threads = t.academic.threads;
  const publicationsQuery = usePublications();
  const publications = publicationsQuery.data ?? [];
  const location = useLocation();
  const navigate = useNavigate();

  // A link from before each thread had a page (`/research#kernels`) opens
  // the thread's page in its place.
  useEffect(() => {
    const thread = threadForAnchor(location.hash);
    if (thread) navigate(`/research/${thread.slug}`, { replace: true });
  }, [location.hash, navigate]);

  const publicationLabels = {
    view: t.academic.view,
    stack: t.academic.stack,
    established: t.academic.established,
    author: t.academic.author,
    authors: t.academic.authors,
    status: t.academic.status,
  };
  // The stack opens on the published paper, preprints behind it; newest
  // first within each.
  const isPreprint = (paper: UiPublication) => /arxiv/i.test(paper.journal);
  const papersInOrder = [...publications].sort(
    (a, b) => Number(isPreprint(a)) - Number(isPreprint(b)) || (b.year ?? 0) - (a.year ?? 0),
  );
  const paperByLink = new Map(publications.map((paper) => [paper.link, paper]));
  // Journal articles and preprints counted apart, so the header never
  // passes a preprint off as a publication.
  const plural = new Intl.PluralRules(language);
  const count = (forms: Record<string, string>, n: number) =>
    fillTemplate(forms[plural.select(n)] ?? forms.other, { n });
  const preprints = publications.filter(isPreprint).length;
  const papersLink = [
    count(threads.journalCount, publications.length - preprints),
    count(threads.preprintCount, preprints),
  ].join(" · ");

  const status = queryStatus([publicationsQuery], {
    loading: t.common.loading,
    error: t.academic.error,
    retry: t.academic.tryAgain,
  });

  return (
    <>
      {/* Every subpage opens the same way: the header alone on the page
          background, then its first section on white, the sections after
          it alternating, and the closing on the colour field. */}
      <Section className="relative isolate overflow-hidden md:py-10">
        <HeaderShapes variant="research" />
        <SectionHeading
          level={1}
          eyebrow={t.academic.eyebrow}
          title={t.academic.title}
          leadLine={story.lead}
          // mb-0 at every width: the heading's own md:mb-12 would add a gap
          // under the lead that the band's padding already gives.
          className="mb-0 md:mb-0"
        />
        {publications.length > 0 && (
          <p className="relative mt-5 text-base md:text-body-lg">
            <a href="#publications" className={LINK}>
              {papersLink} ↓
            </a>
          </p>
        )}
      </Section>

      {/* The threads, one row each: the glimpse in columns 1–4, the status,
          title, question and papers in 5–12. The whole row opens the thread
          (its title's link covers it), and says so under the pointer or the
          title's keyboard focus: the row takes a faint tint, the glimpse its
          hover lavender and the arrow steps on. The papers' own links sit
          above that cover, each named as a journal article or a preprint,
          and focusing one does not light the row; a thread with none yet
          says so. On a phone the glimpse is a strip above the text, so the
          text keeps the full width. */}
      <Section id="threads" tone="surface">
        <SectionHeading eyebrow={eyebrow(1)} title={threads.title} />
        <ol>
          {RESEARCH_THREADS.map((thread, index) => {
            const { title, lead } = threadCopy(t, thread.slug);
            const papers = thread.papers
              .map((link) => paperByLink.get(link))
              .filter((paper) => paper !== undefined);
            return (
              <Reveal
                as="li"
                key={thread.slug}
                className="group relative -mx-4 grid gap-3 rounded-card border-t border-border px-4 py-6 transition-colors duration-200 hover:bg-lavender/30 has-[h3_a:focus-visible]:bg-lavender/30 motion-reduce:transition-none md:-mx-6 md:grid-cols-12 md:items-center md:gap-6 md:px-6 md:py-8"
              >
                <div className="h-24 overflow-hidden rounded-card bg-lavender px-4 py-2 transition-colors duration-200 group-hover:bg-lavender-hover group-has-[h3_a:focus-visible]:bg-lavender-hover motion-reduce:transition-none md:col-span-4 md:h-32 md:py-3">
                  <ThreadGlimpse slug={thread.slug} />
                </div>
                <div className="md:col-span-8">
                  <p className="font-mono text-meta uppercase tracking-widest text-iris">
                    {formatCounter(index + 1, RESEARCH_THREADS.length)}
                    <span className="text-muted-foreground">
                      {" "}
                      · {threads.statuses[thread.status]}
                    </span>
                  </p>
                  <h3 className="mt-2 text-card-title-sm font-semibold md:text-card-title">
                    <Link
                      to={`/research/${thread.slug}`}
                      className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-iris"
                    >
                      {title}{" "}
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-200 group-hover:translate-x-1 group-has-[h3_a:focus-visible]:translate-x-1 motion-reduce:transition-none"
                      >
                        →
                      </span>
                    </Link>
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground md:text-body-lg">{lead}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {threads.papers}:{" "}
                    {papers.length === 0
                      ? threads.noPapers
                      : papers.map((paper, at) => (
                          <span key={paper.link}>
                            {at > 0 && " · "}
                            <span className="font-mono text-meta uppercase tracking-wide">
                              {isPreprint(paper) ? threads.kinds.preprint : threads.kinds.journal}
                            </span>{" "}
                            <a
                              href={paper.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`relative z-10 ${LINK}`}
                            >
                              {paper.journal} {paper.year}
                            </a>
                          </span>
                        ))}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Section>

      {/* All the papers, with their links and details: the threads tell the
          story, this is the record. */}
      <Section id="publications" className="py-12 md:py-16">
        <SectionHeading eyebrow={eyebrow(2)} title={t.academic.publications} />
        {status ??
          (publications.length === 0 ? (
            <StatusMessage variant="empty" message={t.academic.noPublications} />
          ) : (
            // Filed on its own entrance, so not wrapped in the kit's fade.
            <PublicationStack
              publications={papersInOrder}
              labels={publicationLabels}
              summaries={t.academic.publicationSummaries}
            />
          ))}
      </Section>

      {/* How the page ends, as every subpage does: a question in its own
          terms and two ways to answer it. */}
      <PageClosing
        copy={story.researchClosing}
        next={{ ...story.researchClosing.next, to: "/education" }}
      />
    </>
  );
};

export default Academic;
