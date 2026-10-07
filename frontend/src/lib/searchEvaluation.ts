/**
 * The search evaluation behind "Farby, pędzle i Mark II": four variants run
 * three times each over twelve questions (108 expected hits), with ten decoy
 * lines. The numbers are the piece's own table; the chosen variant is #145.
 */
export type SearchVariant = {
  key: "old" | "trim" | "new" | "both";
  hits: number;
  falseHits: number;
  chosen?: boolean;
};

export const EXPECTED_HITS = 108;

export const SEARCH_VARIANTS: readonly SearchVariant[] = [
  { key: "old", hits: 53, falseHits: 13 },
  { key: "trim", hits: 81, falseHits: 19 },
  { key: "new", hits: 91, falseHits: 6, chosen: true },
  { key: "both", hits: 94, falseHits: 12 },
];
