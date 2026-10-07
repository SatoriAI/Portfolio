/**
 * Where a skill's lane runs on the career axis: the months of every role that
 * proves it, merged where roles overlap or meet, gaps kept. And whether the
 * claimed level reaches back further than the roles can show, so the lane can
 * say "earlier" rather than draw years no role backs. Pure, so both can be
 * tested without the page.
 */

export type RoleSpan = {
  /** Month offsets on the axis; the end is exclusive. */
  startMonth: number;
  endMonth: number;
  /** Still running. */
  current: boolean;
};

export type LaneSegment = RoleSpan;

/** The role spans merged into the stretches the skill was in use, in order. */
export function laneSegments(spans: readonly RoleSpan[]): LaneSegment[] {
  const sorted = [...spans].sort((a, b) => a.startMonth - b.startMonth);
  const merged: LaneSegment[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (last && span.startMonth <= last.endMonth) {
      last.current = span.endMonth >= last.endMonth ? span.current : last.current;
      last.endMonth = Math.max(last.endMonth, span.endMonth);
    } else {
      merged.push({ ...span });
    }
  }
  return merged;
}

/**
 * Whether a claim of `claimedYears` reaches back past the first drawn month,
 * counting back from the end of the axis (`months`, the month after now).
 */
export function claimsEarlier(
  segments: readonly LaneSegment[],
  claimedYears: number | null,
  months: number,
): boolean {
  if (claimedYears === null || segments.length === 0) return false;
  return months - claimedYears * 12 < segments[0].startMonth;
}
