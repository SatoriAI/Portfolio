import { useEffect, useState } from "react";

// False at build time, and in the browser while it takes over a page the
// build rendered; main.tsx sets it when it renders a page afresh instead
// (404.html), where there is nothing to match.
let renderedAfresh = false;

/** Called by main.tsx before rendering a page that has no prerendered content. */
export const renderAfresh = () => {
  renderedAfresh = true;
};

/**
 * False while rendering at build time and while the browser takes over the
 * page that render wrote (see main.tsx), true from the effect after. Whatever
 * only the browser can know (the reader's theme, the year, a portal into
 * document.body) waits for it, so the takeover renders exactly what the
 * build wrote.
 *
 * An effect's update, not a useSyncExternalStore: the store's correction is
 * a synchronous update, which React cannot hold back while the page's
 * Suspense boundary is still being taken over, so it throws the boundary's
 * HTML away and renders it afresh (error #421). An update from an effect
 * has default priority, and React takes the boundary over first.
 *
 * A component mounted after the takeover still starts at false and renders
 * once more. Flipping the flag for good after the first takeover would be
 * wrong while a Suspense boundary is still being taken over after the rest.
 */
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(renderedAfresh);
  useEffect(() => setHydrated(true), []);
  return hydrated;
};
