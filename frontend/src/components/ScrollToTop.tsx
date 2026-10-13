import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * The longest a link keeps at it, waiting for its section and then holding
 * it: a cold API can take well over ten seconds to answer.
 */
const LIMIT_MS = 20000;

/**
 * Quiet time after which a scroll the link started counts as finished. It is
 * the fallback for browsers without `scrollend`, and for a re-alignment that
 * had nothing to move; it is generous so that a busy main thread delaying a
 * smooth scroll's first frame does not pass that scroll off as the reader's.
 */
const SCROLL_IDLE_MS = 500;

/** Any of these means the reader has taken over, so a late scroll would hijack them. */
const READER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Keeps navigation predictable: a route change lands at the top, and a hash
 * (e.g. /#projects, also when arriving from another page) scrolls to that
 * section once it exists in the DOM.
 */
const ScrollToTop = () => {
  const location = useLocation();
  const { pathname, hash } = location;
  // The router reports the page's first location as a POP too, so a
  // traversal is a POP to any location other than the one the page opened on.
  const landing = useRef(location);
  const traversal = useNavigationType() === "POP" && location !== landing.current;

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const id = hash.slice(1);

    // Back and Forward return to a place the reader has already been, so the
    // browser's own scroll restoration should win; scrolling to the section
    // would drag them away from where they left the page.
    if (traversal) return;

    // A page fills in from its data after it commits: a section drawn from
    // data (the skills, the publications) appears late, and sections above
    // the target grow as theirs arrives, which leaves an early scroll short.
    // On a cold API either can take ten seconds or more, and nothing tells
    // the link when the page is done. So it waits for its section, scrolls to
    // it, and keeps it at the top until the reader moves the page themselves,
    // by input or by any scroll the link did not start (a scrollbar drag,
    // find in page, a screen reader); only a reader who never touches the
    // page meets the time limit. Browser scroll anchoring already holds a
    // section that is at rest, but not one a smooth scroll is still
    // travelling towards, whose destination was fixed before the content
    // above it grew, nor one near the end of a page that was too short to
    // reach it, which is where a long wait usually leaves it; re-aligning on
    // every change of the page's height covers both. A hash that never names
    // an element, such as a degree's or a role's slug which its own page
    // opens, simply lapses. The pages' own replaceHash bypasses the router,
    // so choosing an entry never starts any of this.
    let target: HTMLElement | null = null;
    // Whether a scroll now under way is the link's own. A re-alignment also
    // covers the scroll anchoring's adjustment in the same frame.
    let ours = false;
    let idle = 0;
    const settled = () => {
      ours = false;
    };
    const expectScroll = () => {
      ours = true;
      window.clearTimeout(idle);
      idle = window.setTimeout(settled, SCROLL_IDLE_MS);
    };
    const onScroll = () => (ours ? expectScroll() : release());
    const align = () => {
      expectScroll();
      target?.scrollIntoView({ block: "start" });
    };

    const settling = new ResizeObserver(align);
    const arrival = new MutationObserver(() => found(document.getElementById(id)));
    const found = (element: HTMLElement | null) => {
      if (!element) return;
      target = element;
      arrival.disconnect();
      align();
      settling.observe(document.body);
    };
    const limit = window.setTimeout(() => release(), LIMIT_MS);
    const release = () => {
      arrival.disconnect();
      settling.disconnect();
      [limit, idle].forEach((timer) => window.clearTimeout(timer));
      READER_INPUT.forEach((type) => window.removeEventListener(type, release));
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", settled);
    };
    READER_INPUT.forEach((type) => window.addEventListener(type, release, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", settled);

    // Effects run after the new page has committed, so a static section is
    // normally already there.
    const present = document.getElementById(id);
    if (present) found(present);
    else arrival.observe(document.body, { childList: true, subtree: true });
    return release;
  }, [pathname, hash, traversal]);

  return null;
};

export default ScrollToTop;
