import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

import { arrivalScroll } from "@/lib/arrivalScroll";
import { sectionScrollBehavior } from "@/lib/media";

/**
 * The longest a link keeps at it, waiting for its section and then holding
 * it: a cold API can take well over ten seconds to answer.
 */
const LIMIT_MS = 20000;

/**
 * How far, in pixels, the section may sit from its place and still count as
 * there: scroll anchoring and rounding leave it a fraction off.
 */
const IN_PLACE_PX = 2;

/** Any of these means the reader has taken over, so a late scroll would hijack them. */
const READER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Keeps navigation predictable: a route change lands at the top, and a hash
 * (e.g. /#projects, also when arriving from another page) scrolls to that
 * section once it exists in the DOM. Back and Forward, and the page the
 * reader opened, are left where the browser put them (see arrivalScroll).
 */
const ScrollToTop = () => {
  const location = useLocation();
  const { pathname, hash } = location;
  // The router reports the page's first location as a POP too, so a
  // traversal is a POP to any location other than the one the page opened on.
  const landing = useRef(location);
  const onLanding = location === landing.current;
  const traversal = useNavigationType() === "POP" && !onLanding;
  const scroll = arrivalScroll({ landing: onLanding, traversal, hash });

  useEffect(() => {
    if (scroll === "stay") return;
    if (scroll === "top") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    const id = hash.slice(1);

    // A page fills in from its data after it commits, so a section drawn
    // from data appears late, and sections above it grow, leaving an early
    // scroll short; on a cold API either can take ten seconds or more. So
    // the link waits for its section, scrolls to it, and re-aligns it on
    // every change of the page's height until the reader moves the page
    // (scroll anchoring holds a section at rest, but not one a smooth scroll
    // is still travelling to, nor one at the end of a page too short to
    // reach it). A hash that names no element, such as a degree's or a
    // role's slug which its page opens itself, simply lapses; the pages'
    // replaceHash bypasses the router, so choosing an entry starts none of it.
    let target: HTMLElement | null = null;
    // A scroll is told apart by its direction, not its timing: the link's own
    // only ever move the page towards the section, and scroll anchoring keeps
    // the section where it is, so a scroll that carries the page away from
    // the section is the reader's, however soon it comes. Before the section
    // exists the link has not scrolled at all, so any scroll is the reader's.
    let lastY = window.scrollY;
    const onScroll = () => {
      const delta = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!target) return release();
      const offset =
        target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop);
      const away = (offset > IN_PLACE_PX && delta < 0) || (offset < -IN_PLACE_PX && delta > 0);
      if (away) release();
    };
    const align = () =>
      target?.scrollIntoView({ block: "start", behavior: sectionScrollBehavior() });

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
      window.clearTimeout(limit);
      READER_INPUT.forEach((type) => window.removeEventListener(type, release));
      window.removeEventListener("scroll", onScroll);
    };
    READER_INPUT.forEach((type) => window.addEventListener(type, release, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });

    // Effects run after the new page has committed, so a static section is
    // normally already there.
    const present = document.getElementById(id);
    if (present) found(present);
    else arrival.observe(document.body, { childList: true, subtree: true });
    return release;
  }, [pathname, hash, scroll]);

  return null;
};

export default ScrollToTop;
