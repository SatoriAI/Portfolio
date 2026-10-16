import { useCallback } from "react";
import { QueryClient, useQuery } from "@tanstack/react-query";

import { loadArticleBody } from "@/content/workshop";
import { useSettings } from "@/contexts/SettingsContext";

import { fetchExperiences, mapApiExperienceToUi } from "./experiencesService";
import { fetchProjects, mapApiProjectToUi } from "./projectsService";
import { fetchPublications, mapApiPublicationToUi } from "./publicationsService";
import { fetchSchools, mapApiSchoolToUi } from "./schoolsService";
import { fetchSkills, mapApiSkillToUi } from "./skillsService";
import type { ListName, Snapshot } from "./snapshot";
import { fetchTestimonials, mapApiTestimonialToUi } from "./testimonialsService";
import type { ArticleHeader } from "./workshop";

/**
 * The backend's lists, one query each. The backend sends every translation
 * in one answer, so a list is fetched once and keyed by the resource alone;
 * the reader's language is picked when it is read. Switching language
 * re-reads the cache rather than fetching again, so nothing on the page
 * blanks or loses its place.
 */

/** One per page in the browser, and one per page rendered at build time. */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // The content changes when Dawid edits it, not while someone reads.
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        // One quiet retry, then the page's own error state and its retry button.
        retry: 1,
      },
    },
  });

/**
 * Puts the lists the build fetched (lib/snapshot.ts) into `client` as each
 * one's data, as of when they were fetched; the same call on both sides of
 * a page, so the browser takes over what the build drew. Each is marked
 * stale, so the page's first render in the browser fetches it again at once,
 * picking up edits made since the build; only then does the staleTime above
 * hold. An unchanged answer keeps the same data (React Query shares what is
 * equal), so nothing on the page redraws.
 */
export const seedLists = (client: QueryClient, snapshot: Snapshot) => {
  for (const [name, data] of Object.entries(snapshot.lists)) {
    client.setQueryData([name], data, { updatedAt: snapshot.fetchedAt });
    void client.invalidateQueries({ queryKey: [name], exact: true, refetchType: "none" });
  }
};

const useListQuery = <Api, Ui>(
  resource: ListName,
  fetcher: () => Promise<Api[]>,
  map: (item: Api, language: string) => Ui,
) => {
  const { language } = useSettings();
  const select = useCallback(
    (items: Api[]) => items.map((item) => map(item, language)),
    [map, language],
  );
  return useQuery({ queryKey: [resource], queryFn: fetcher, select });
};

export const useProjects = () => useListQuery("projects", fetchProjects, mapApiProjectToUi);
export const useExperiences = () =>
  useListQuery("experiences", fetchExperiences, mapApiExperienceToUi);
export const useSkills = () => useListQuery("skills", fetchSkills, mapApiSkillToUi);
export const usePublications = () =>
  useListQuery("publications", fetchPublications, mapApiPublicationToUi);
export const useSchools = () => useListQuery("schools", fetchSchools, mapApiSchoolToUi);
export const useTestimonials = () =>
  useListQuery("testimonials", fetchTestimonials, mapApiTestimonialToUi);

/**
 * A workshop piece's text, its own chunk, fetched once per piece and
 * language; idle until the piece is known.
 */
const articleTextKey = (article: ArticleHeader | undefined) => [
  "workshop-text",
  article?.slug,
  article?.language,
  article?.draft,
];

export const useArticleText = (article: ArticleHeader | undefined) =>
  useQuery({
    queryKey: articleTextKey(article),
    queryFn: () => loadArticleBody(article as ArticleHeader),
    enabled: article !== undefined,
  });

/** A piece's text, fetched ahead of its page's first render (see preparePage). */
export const prefetchArticleText = (client: QueryClient, article: ArticleHeader) =>
  client.prefetchQuery({
    queryKey: articleTextKey(article),
    queryFn: () => loadArticleBody(article),
  });
