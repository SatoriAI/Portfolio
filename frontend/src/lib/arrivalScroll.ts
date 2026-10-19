/**
 * Where a location change leaves the page, as a pure rule (ScrollToTop runs
 * it): at the top, at the hash's section, or where it is.
 */
export type ArrivalScroll = "top" | "section" | "stay";

export const arrivalScroll = ({
  landing,
  traversal,
  hash,
}: {
  /** The location the page opened on. */
  landing: boolean;
  /** Back or Forward. */
  traversal: boolean;
  hash: string;
}): ArrivalScroll => {
  // Back and Forward return to a place the reader has already been, so the
  // browser's own scroll restoration wins.
  if (traversal) return "stay";
  if (hash) return "section";
  // The page the reader opened is already where the browser put it: at the
  // top, or where a reload left it. Its content is in the HTML, so the reader
  // may also have scrolled before the script ran; going to the top when it
  // takes the page over would throw them back.
  if (landing) return "stay";
  return "top";
};
