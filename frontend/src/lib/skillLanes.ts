/**
 * Where a skill's lane runs on the career axis: the months of every role that
 * proves it, merged where roles overlap or meet, gaps kept. Before them, the
 * years it was used outside any role (its own start year, where that came
 * first), drawn apart from the roles, and the count of years the two make
 * together. Pure, so it can be tested without the page.
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

export type SkillReach = {
  /** The months used before the first role, drawn dashed; null when the roles come first. */
  leadIn: { startMonth: number; endMonth: number } | null;
  /** The start year lies before the axis, so the lead-in is cut at its edge. */
  beforeAxis: boolean;
  /** Whole years from the first month of use to now, or null when nothing places it in time. */
  years: number | null;
};

/**
 * How far a skill reaches: from its start year (`sinceMonth`, on the axis,
 * negative before it) or its first role, whichever came first, to now (the
 * axis ends on the month after now, `months`). A start year after the first
 * role adds nothing; one with no role behind it runs on to now.
 */
export function skillReach(
  segments: readonly LaneSegment[],
  sinceMonth: number | null,
  months: number,
): SkillReach {
  const firstRole = segments[0]?.startMonth ?? null;
  const ownFirst = sinceMonth !== null && (firstRole === null || sinceMonth < firstRole);
  const start = ownFirst ? sinceMonth : firstRole;
  return {
    leadIn: ownFirst
      ? { startMonth: Math.max(sinceMonth, 0), endMonth: firstRole ?? months }
      : null,
    beforeAxis: ownFirst && sinceMonth < 0,
    years: start === null ? null : Math.floor((months - 1 - start) / 12),
  };
}
