/**
 * Layout for a career drawn to scale: months on the horizontal axis, one lane
 * per set of overlapping spans. Pure, so the lane assignment and the domain
 * can be tested without a browser.
 */

export type TimelineInput = {
  id: number;
  /** ISO date. */
  start: string;
  /** ISO date, or empty while the span is still running. */
  end: string;
};

export type TimelineSpan = {
  id: number;
  /** Month offsets from the domain start; the end is exclusive. */
  startMonth: number;
  endMonth: number;
  lane: number;
  current: boolean;
};

export type TimelineTick = {
  year: number;
  /** Month offset of that year's January from the domain start. */
  month: number;
};

export type Timeline = {
  spans: TimelineSpan[];
  /** Total months in the domain. */
  months: number;
  lanes: number;
  ticks: TimelineTick[];
};

const monthIndex = (iso: string): number => {
  const date = new Date(iso);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};

/**
 * Lays the spans out. The domain runs from the first month of the earliest
 * span to the month after the latest end (or after `now`, for a span still
 * running). Spans take the first lane whose previous occupant has ended, so
 * consecutive roles share a lane and concurrent ones stack.
 */
export function buildTimeline(items: readonly TimelineInput[], now: Date): Timeline {
  const nowMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const dated = items
    .filter((item) => item.start)
    .map((item) => ({
      id: item.id,
      start: monthIndex(item.start),
      end: item.end ? monthIndex(item.end) + 1 : nowMonth + 1,
      current: !item.end,
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (dated.length === 0) return { spans: [], months: 0, lanes: 0, ticks: [] };

  const origin = Math.min(...dated.map((item) => item.start));
  const last = Math.max(...dated.map((item) => item.end));

  const laneEnds: number[] = [];
  const spans = dated.map((item) => {
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    return {
      id: item.id,
      startMonth: item.start - origin,
      endMonth: item.end - origin,
      lane,
      current: item.current,
    };
  });

  const ticks: TimelineTick[] = [];
  for (let month = origin; month < last; month++) {
    if (month % 12 === 0) ticks.push({ year: month / 12, month: month - origin });
  }

  return { spans, months: last - origin, lanes: laneEnds.length, ticks };
}
