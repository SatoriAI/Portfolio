/**
 * The state of a scroll entrance (Reveal, the research figures), as pure
 * rules so they can be tested without a browser.
 */
export type Entrance = {
  /** Whether it enters at all: measured below the fold, with motion allowed. */
  animated: boolean;
  /** Whether it is shown: always when it does not enter, else once revealed. */
  shown: boolean;
  /**
   * Whether its transitions (and their delays) are on: only from the reveal
   * on. When the browser measures a page the build wrote, what is below the
   * fold is hidden at once, never faded out of the HTML; a delay alone still
   * runs a transition, holding the old value first.
   */
  entering: boolean;
};

export const entrance = ({
  measured,
  initiallyVisible,
  reducedMotion,
  revealed,
}: {
  /** The browser has placed the element (never at build time). */
  measured: boolean;
  /** It was on screen when measured. */
  initiallyVisible: boolean;
  reducedMotion: boolean;
  /** It has scrolled into view. */
  revealed: boolean;
}): Entrance => {
  const animated = measured && !reducedMotion && !initiallyVisible;
  return { animated, shown: !animated || revealed, entering: animated && revealed };
};
