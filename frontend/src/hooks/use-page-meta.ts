import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { showDrafts, workshopArticles } from "@/content/workshop";
import { useSettings } from "@/contexts/SettingsContext";
import { applyHeadTags } from "@/lib/applyHeadTags";
import { pageHeadTags } from "@/lib/headTags";
import { pageMeta } from "@/lib/pageMeta";

/**
 * Keeps the head on the page being shown: its title, description,
 * canonical address, alternates and Open Graph text, from the same
 * pageMeta the build writes into each page's HTML. A load already has them
 * right; this carries them along as the reader moves between pages, and
 * fills them in on 404.html, which names no address. A page without an
 * address of its own has its canonical, og:url and alternates taken out
 * while it is shown, rather than naming the address that was mistyped.
 */
export function usePageMeta() {
  const { pathname } = useLocation();
  const { language } = useSettings();
  const head = useMemo(
    () => pageMeta(pathname, language, workshopArticles, { drafts: showDrafts }),
    [pathname, language],
  );

  useEffect(() => {
    const previousTitle = document.title;
    const restore = applyHeadTags(document, pageHeadTags(head));
    document.title = head.title;

    return () => {
      document.title = previousTitle;
      restore();
    };
  }, [head]);
}
