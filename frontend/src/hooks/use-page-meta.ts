import { useEffect } from "react";

type PageMeta = {
  title: string;
  description: string;
};

/**
 * Gives a route its own title and description. Only the document is touched;
 * Open Graph tags stay static in index.html because scrapers never run this.
 */
export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? "";

    document.title = title;
    meta?.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      meta?.setAttribute("content", previousDescription);
    };
  }, [title, description]);
}
