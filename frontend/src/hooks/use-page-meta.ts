import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { applyHeadTags, pageHeadTags, type PageMeta } from "@/lib/headTags";

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
    const previousTitle = document.title;
    const restore = applyHeadTags(
      document,
      pageHeadTags({ title, description, canonical }, pathname),
    );
    document.title = title;

    return () => {
      document.title = previousTitle;
      restore();
    };
  }, [title, description, canonical, pathname]);
}
