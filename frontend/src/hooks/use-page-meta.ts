import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { absoluteUrl } from "@/lib/siteMap";

type PageMeta = {
  title: string;
  description: string;
};

/**
 * Gives a route its own title, description, canonical address and Open Graph
 * text, over the defaults in index.html. Scrapers that do not run scripts
 * (link previews) read those defaults; a crawler that renders the page, as
 * Google does, reads these.
 */
export function usePageMeta({ title, description }: PageMeta) {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = absoluteUrl(pathname);
    const tags: [string, string, string][] = [
      ['meta[name="description"]', "content", description],
      ['meta[property="og:title"]', "content", title],
      ['meta[property="og:description"]', "content", description],
      ['meta[property="og:url"]', "content", url],
      ['link[rel="canonical"]', "href", url],
    ];
    const previousTitle = document.title;
    const restore = tags.map(([selector, attribute, value]) => {
      const element = document.head.querySelector(selector);
      const previous = element?.getAttribute(attribute) ?? "";
      element?.setAttribute(attribute, value);
      return () => element?.setAttribute(attribute, previous);
    });
    document.title = title;

    return () => {
      document.title = previousTitle;
      restore.forEach((undo) => undo());
    };
  }, [title, description, pathname]);
}
