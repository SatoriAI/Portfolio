/**
 * The backend stores a skill's level as free text, and the text it holds today
 * is "10+ years of experience", "5+ years of experience" and so on. That is a
 * number with a unit, and a number can be drawn. This reads the number back
 * out; anything that is not of that shape stays text.
 */
export const parseYears = (level: string): number | null => {
  const match = /^\s*(\d+)\s*\+?/.exec(level);
  if (!match) return null;
  const years = Number(match[1]);
  return Number.isFinite(years) && years > 0 ? years : null;
};

/**
 * Polish counts years three ways: 1 rok, 2–4 lata, 5–21 lat, then 22–24 lata
 * again, and so on by the last digit, except that 12–14 are always lat.
 */
export const polishYears = (count: number): string => {
  if (count === 1) return "rok";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return "lata";
  return "lat";
};

/** "10+ yrs" in English, "10+ lat" in Polish. */
export const formatYears = (count: number, language: string): string =>
  language.toLowerCase() === "pl" ? `${count}+ ${polishYears(count)}` : `${count}+ yrs`;
