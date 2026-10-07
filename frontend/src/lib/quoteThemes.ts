/**
 * What students praise, found in their own words. Each quote carries, per
 * theme, the phrases that say it; a phrase counts only where it is found in
 * the quote's text as the backend holds it now, so a reworded review loses
 * its highlight and its place in the count instead of claiming a phrase it
 * no longer contains. Pure, so the matching can be tested without the page.
 */

/** Per theme, the phrases in one quote that say it. */
export type ThemePhrases = Readonly<Record<string, readonly string[]>>;

export type QuoteSegment = {
  text: string;
  /** The theme this stretch of the quote says, if any. */
  theme?: string;
};

type Match = { start: number; end: number; theme: string };

/**
 * Spaces compared as spaces. Polish copy binds a one-letter word to the next
 * with a no-break space, and the phrases (from the typeset copy) and the
 * reviews (from the backend) need not agree on which spaces are bound. One
 * character for one, so positions found in the plain text hold in the text
 * as it reads.
 */
const plainSpaces = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

/** Where each phrase stands in the text, leaving out phrases not found and any that overlap an earlier one. */
const matches = (text: string, phrases: ThemePhrases): Match[] => {
  const plain = plainSpaces(text);
  const found = Object.entries(phrases)
    .flatMap(([theme, list]) =>
      list.map((phrase) => {
        const start = phrase ? plain.indexOf(plainSpaces(phrase)) : -1;
        return { start, end: start + phrase.length, theme };
      }),
    )
    .filter((match) => match.start >= 0)
    .sort((a, b) => a.start - b.start);
  const kept: Match[] = [];
  for (const match of found) {
    const previous = kept[kept.length - 1];
    if (!previous || match.start >= previous.end) kept.push(match);
  }
  return kept;
};

/** The quote cut into plain stretches and stretches that say a theme, in reading order. */
export function segmentQuote(text: string, phrases: ThemePhrases): QuoteSegment[] {
  const segments: QuoteSegment[] = [];
  let cursor = 0;
  for (const { start, end, theme } of matches(text, phrases)) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start) });
    segments.push({ text: text.slice(start, end), theme });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** The themes a quote says, by the phrases actually found in it. */
export function themesIn(text: string, phrases: ThemePhrases): Set<string> {
  return new Set(matches(text, phrases).map((match) => match.theme));
}

/** How many quotes say each theme; a theme no quote says is counted as 0. */
export function themeCounts(
  quotes: readonly { text: string; phrases: ThemePhrases }[],
  themes: readonly string[],
): Record<string, number> {
  const counts = Object.fromEntries(themes.map((theme) => [theme, 0]));
  for (const { text, phrases } of quotes) {
    for (const theme of themesIn(text, phrases)) {
      if (theme in counts) counts[theme] += 1;
    }
  }
  return counts;
}
