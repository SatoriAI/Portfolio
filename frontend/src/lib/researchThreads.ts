import type { translations } from "@/utils/translations";

/**
 * The research threads, each with a page of its own under `/research/<slug>`
 * and a row on the Research index, in the index's order. Kept apart from the
 * components that draw them, so the site map and the pages' heads (lib/
 * siteMap.ts, lib/pageMeta.ts) can list them without loading a figure.
 */
export const RESEARCH_THREADS = [
  {
    slug: "heat-kernels",
    /** The section's id when the threads shared one page, so an old link still lands. */
    anchor: "kernels",
    status: "published",
    /** The papers the thread rests on, by their links in the publication list. */
    papers: ["https://doi.org/10.1016/j.jat.2023.105921", "https://arxiv.org/abs/2411.15793"],
  },
  {
    slug: "generalisation",
    anchor: "transformers",
    status: "ongoing",
    papers: [],
  },
  {
    slug: "neural-operators",
    anchor: "neural-operators",
    status: "preprint",
    papers: ["https://arxiv.org/abs/2610.20106"],
  },
  {
    slug: "quantum-algorithm",
    anchor: "jacobi-quantum",
    status: "plan",
    papers: [],
  },
] as const;

export type ResearchThread = (typeof RESEARCH_THREADS)[number];
export type ResearchSlug = ResearchThread["slug"];

/** The page of each thread, by path without a language. */
export const researchThreadPaths = RESEARCH_THREADS.map(({ slug }) => `/research/${slug}`);

export const findThread = (slug: string | undefined) =>
  RESEARCH_THREADS.find((thread) => thread.slug === slug?.toLowerCase());

/** The thread an old in-page link (`/research#kernels`) meant, if any. */
export const threadForAnchor = (hash: string) =>
  RESEARCH_THREADS.find((thread) => `#${thread.anchor}` === hash);

type Copy = (typeof translations)["en"];

/** A thread's title and its one-line question, from the page's copy in one language. */
export const threadCopy = (t: Copy, slug: ResearchSlug): { title: string; lead: string } => {
  const story = t.academic.story;
  switch (slug) {
    case "heat-kernels":
      return { title: story.kernels.title, lead: story.kernels.leadLine };
    case "generalisation":
      return { title: t.academic.interests.transformers.title, lead: story.transformers.question };
    case "neural-operators":
      return { title: story.neuralOperators.title, lead: story.neuralOperators.leadLine };
    case "quantum-algorithm":
      return { title: story.jacobiQuantum.title, lead: story.jacobiQuantum.leadLine };
  }
};
