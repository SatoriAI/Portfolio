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

/** "10+ yrs" in English, "10+ lat" in Polish; under a year, "<1 yr" and "<1 rok". */
export const formatYears = (count: number, language: string): string => {
  const pl = language.toLowerCase() === "pl";
  if (count < 1) return pl ? "<1 rok" : "<1 yr";
  return pl ? `${count}+ ${polishYears(count)}` : `${count}+ yrs`;
};
