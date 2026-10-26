import { Link, useParams } from "react-router-dom";

import HeaderShapes from "@/components/brand/HeaderShapes";
import PageClosing from "@/components/layout/PageClosing";
import Section from "@/components/layout/Section";
import SectionHeading from "@/components/layout/SectionHeading";
import { THREAD_BODIES } from "@/components/research/threadBodies";
import { useSettings } from "@/contexts/SettingsContext";
import { findThread, RESEARCH_THREADS, threadCopy } from "@/lib/researchThreads";
import { formatCounter } from "@/lib/text";
import { translations } from "@/utils/translations";

import NotFound from "./NotFound";

/**
 * One research thread on a page of its own: the header names it and asks its
 * question, the story follows on the surface with its figures, and the foot
 * leads back to all the threads and on to the next. An address naming no
 * thread is not-found.
 */
const ResearchThreadPage = () => {
  const { thread: slug } = useParams();
  const { language } = useSettings();
  const t = translations[language];
  const thread = findThread(slug);
  if (!thread) return <NotFound />;

  const index = RESEARCH_THREADS.indexOf(thread);
  const { title, lead } = threadCopy(t, thread.slug);
  const next = RESEARCH_THREADS[(index + 1) % RESEARCH_THREADS.length];
  const Body = THREAD_BODIES[thread.slug];
  const threads = t.academic.threads;
  const counter = formatCounter(index + 1, RESEARCH_THREADS.length);

  return (
    <>
      <Section className="relative isolate overflow-hidden md:py-10">
        <HeaderShapes variant="research" />
        {/* The way back and the way on, at the top as well as the foot. */}
        <nav
          aria-label={threads.title}
          className="relative mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-base"
        >
          <Link to="/research" className="text-foreground transition-colors hover:text-iris">
            ← {threads.back}
          </Link>
          <Link
            to={`/research/${next.slug}`}
            className="text-muted-foreground transition-colors hover:text-iris"
          >
            {threads.next}: {threadCopy(t, next.slug).title} →
          </Link>
        </nav>
        <SectionHeading
          level={1}
          eyebrow={`${counter} · ${threads.statuses[thread.status]}`}
          title={title}
          leadLine={lead}
          className="mb-0 md:mb-0"
        />
      </Section>

      <Section id={thread.anchor} tone="surface">
        <Body />
      </Section>

      {/* The way on: the next thread by name, and back to all of them. */}
      <Section>
        {/* The header's links again, so not a second landmark. */}
        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-baseline sm:justify-between">
          <Link
            to="/research"
            className="text-base text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {threads.back}
          </Link>
          <Link
            to={`/research/${next.slug}`}
            className="text-base font-medium text-foreground transition-colors hover:text-iris"
          >
            <span className="font-mono text-meta uppercase tracking-widest text-iris">
              {threads.next}
            </span>{" "}
            {threadCopy(t, next.slug).title} →
          </Link>
        </div>
      </Section>

      <PageClosing
        copy={t.academic.story.researchClosing}
        next={{ ...t.academic.story.researchClosing.next, to: "/education" }}
      />
    </>
  );
};

export default ResearchThreadPage;
