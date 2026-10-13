import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** How long a link keeps looking after its section before it lets go. */
const HOLD_MS = 4000;

/** Any of these means the reader has taken over, so a late scroll would hijack them. */
const READER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Keeps navigation predictable: a route change lands at the top, and a hash
 * (e.g. /#projects, also when arriving from another page) scrolls to that
 * section once it exists in the DOM.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const id = hash.slice(1);
    let target: HTMLElement | null = null;
    const align = () => target?.scrollIntoView({ block: "start" });

    // A page fills in from its data after it commits: a section drawn from
    // data (the skills, the publications) appears late, and sections above
    // the target grow as theirs arrives, which leaves an early scroll short.
    // So the link waits for its section, then keeps it at the top while the
    // page's height settles. Both end when the reader scrolls, clicks or types
    // first, or after a few seconds; a hash that never names an element, such
    // as a degree's or a role's slug which its own page opens, simply lapses.
    // The pages' own replaceHash bypasses the router, so choosing an entry
    // never starts any of this.
    const settling = new ResizeObserver(align);
    const arrival = new MutationObserver(() => found(document.getElementById(id)));
    const found = (element: HTMLElement | null) => {
      if (!element) return;
      target = element;
      arrival.disconnect();
      align();
      settling.observe(document.body);
    };
    const release = () => {
      arrival.disconnect();
      settling.disconnect();
      window.clearTimeout(deadline);
      READER_INPUT.forEach((type) => window.removeEventListener(type, release));
    };
    const deadline = window.setTimeout(release, HOLD_MS);
    READER_INPUT.forEach((type) => window.addEventListener(type, release, { passive: true }));

    // Effects run after the new page has committed, so a static section is
    // normally already there.
    const present = document.getElementById(id);
    if (present) found(present);
    else arrival.observe(document.body, { childList: true, subtree: true });
    return release;
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
