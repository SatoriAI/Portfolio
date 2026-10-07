/**
 * Where a circle starts when it flies in from the side of the screen: the
 * offset that puts it just outside the nearer of the left and right edges.
 * Never from below, which is where the circles later fly off to, into the
 * sidebar beside the skills; never from the top, where the header sits.
 * Nothing for a circle not on screen, which the reader would not see arrive.
 */

type Box = { left: number; right: number; top: number; bottom: number };

/** How far past the edge the circle starts, so none of its shadow shows. */
const CLEAR_PX = 24;

export function edgeOffset(box: Box, width: number, height: number) {
  if (box.bottom <= 0 || box.top >= height || box.right <= 0 || box.left >= width) return null;
  const fromLeft = (box.left + box.right) / 2 <= width / 2;
  return { x: fromLeft ? -box.right - CLEAR_PX : width - box.left + CLEAR_PX, y: 0 };
}
