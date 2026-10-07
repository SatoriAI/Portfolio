import { QueryClient, useQuery } from "@tanstack/react-query";

import { useSettings } from "@/contexts/SettingsContext";

import { fetchExperiences } from "./experiencesService";
import { fetchProjects } from "./projectsService";
import { fetchPublications } from "./publicationsService";
import { fetchSchools } from "./schoolsService";
import { fetchSkills } from "./skillsService";
import { fetchTestimonials } from "./testimonialsService";

/**
 * The backend's lists, one query each, keyed by the resource and the language
 * they are shown in. Switching language is a new key rather than a refetch
 * into the same state, so a slow answer for the old language can never
 * overwrite the new one, and switching back is instant from the cache.
 */

export const queryClient = new QueryClient({
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

const useListQuery = <T>(resource: string, fetcher: (language: string) => Promise<T[]>) => {
  const { language } = useSettings();
  return useQuery({ queryKey: [resource, language], queryFn: () => fetcher(language) });
};

export const useProjects = () => useListQuery("projects", fetchProjects);
export const useExperiences = () => useListQuery("experiences", fetchExperiences);
export const useSkills = () => useListQuery("skills", fetchSkills);
export const usePublications = () => useListQuery("publications", fetchPublications);
export const useSchools = () => useListQuery("schools", fetchSchools);
export const useTestimonials = () => useListQuery("testimonials", fetchTestimonials);
