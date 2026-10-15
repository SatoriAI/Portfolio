import { useEffect, useState } from "react";

// False at build time, and in the browser while it takes over a page the
// build rendered; main.tsx sets it when it renders a page afresh instead
// (404.html), where nothing has to match.
let renderedAfresh = false;

/** Called by main.tsx before rendering a page that has no prerendered content. */
export const renderAfresh = () => {
  renderedAfresh = true;
};

/**
 * False while rendering at build time and while the browser takes over the
 * page that render wrote (see main.tsx), true once it has. Whatever only the
 * browser can know (the reader's theme, the year, a portal into
 * document.body) waits for it, so the takeover renders exactly what the
 * build wrote.
 *
 * Set from an effect rather than read through useSyncExternalStore: the
 * store's re-render is synchronous, and a synchronous update reaching the
 * page's Suspense boundary before React has taken it over makes React throw
 * the boundary's HTML away and render it again (error #421). An effect's
 * update waits for the boundary.
 */
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(renderedAfresh);
  useEffect(() => setHydrated(true), []);
  return hydrated;
};
