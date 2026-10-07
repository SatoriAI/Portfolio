/**
 * The geometry of a panel that grows out of a circle: the clip-path circle it
 * starts as, sitting exactly on the circle that was pressed, and the one it
 * ends as, wide enough to uncover the whole panel and its shadow. Pure, so it
 * can be tested without a browser.
 */

export type Box = { left: number; top: number; width: number; height: number };

export type Reveal = { from: string; to: string };

/** Room beyond the panel's corners, so its shadow is uncovered too. */
const SHADOW_ROOM_PX = 48;

export function revealFromCircle(panel: Box, circle: Box): Reveal {
  // The circle's centre, in the panel's own coordinates; it may lie outside
  // the panel, which clip-path accepts.
  const x = circle.left + circle.width / 2 - panel.left;
  const y = circle.top + circle.height / 2 - panel.top;
  const farthest = Math.max(
    Math.hypot(x, y),
    Math.hypot(panel.width - x, y),
    Math.hypot(x, panel.height - y),
    Math.hypot(panel.width - x, panel.height - y),
  );
  const at = `at ${x}px ${y}px`;
  return {
    from: `circle(${circle.width / 2}px ${at})`,
    to: `circle(${farthest + SHADOW_ROOM_PX}px ${at})`,
  };
}
