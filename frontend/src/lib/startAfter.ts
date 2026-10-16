/**
 * Runs `start` once `ready` has settled, whether or not it succeeded. The
 * page is taken over even when preparing it failed (a chunk or a piece's
 * text that would not load, a deploy between the HTML and its chunks):
 * React then renders what it cannot match afresh, which beats a page that
 * never responds.
 */
export const startAfter = (ready: Promise<unknown>, start: () => void) =>
  ready.catch((error: unknown) => console.error("Preparing the page failed:", error)).then(start);
