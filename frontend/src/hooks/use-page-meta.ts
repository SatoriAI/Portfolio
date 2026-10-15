import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { absoluteUrl } from "@/lib/siteMap";

type PageMeta = {
  title: string;
  description: string;
  /** False for a page with no address of its own, such as not-found. */
  canonical?: boolean;
};

const ADDRESS_TAGS = ['link[rel="canonical"]', 'meta[property="og:url"]'];

/**
 * Gives a route its own title, description, canonical address and Open Graph
 * text, over the defaults in index.html. Scrapers that do not run scripts
 * (link previews) read those defaults; a crawler that renders the page, as
 * Google does, reads these. A page without an address of its own takes the
 * canonical and og:url out while it is shown, rather than naming the address
 * that was mistyped, or home.
 */
export function usePageMeta({ title, description, canonical = true }: PageMeta) {
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
    const removed = canonical
      ? []
      : ADDRESS_TAGS.flatMap((selector) => document.head.querySelector(selector) ?? []);
    removed.forEach((element) => element.remove());
    document.title = title;

    return () => {
      document.title = previousTitle;
      restore.forEach((undo) => undo());
      document.head.append(...removed);
    };
  }, [title, description, canonical, pathname]);
}
