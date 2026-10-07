/**
 * Polish typography forbids a one-letter word at the end of a line: "w", "z",
 * "i", "a", "o", "u" (and their capitals) must travel with the word after
 * them. The convention is enforced by binding the pair with a non-breaking
 * space, which is what every Polish typesetting system does.
 *
 * Only Polish needs this. English has one-letter words too ("a", "I") but no
 * rule against orphaning them, and binding them would only make lines ragged.
 */
const NBSP = " ";

// A lookbehind rather than a captured prefix: with a captured prefix the space
// before the second of two consecutive one-letter words ("i w Xperi") is
// consumed as the first word's trailing space, and the second is skipped.
const ORPHAN = /(?<=^|[\s(„"“])([aiouwzAIOUWZ]) (?=\S)/g;

export const bindOrphans = (text: string): string => text.replace(ORPHAN, `$1${NBSP}`);

/** Applies the language's typographic rules to a run of text. */
export const typeset = (text: string, language: string): string =>
  language.toLowerCase() === "pl" ? bindOrphans(text) : text;

type DeepStrings<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? DeepStrings<U>[]
    : T extends object
      ? { [K in keyof T]: DeepStrings<T[K]> }
      : T;

/** The same rules applied to every string inside a nested copy object. */
export function typesetDeep<T>(value: T, language: string): DeepStrings<T> {
  if (typeof value === "string") return typeset(value, language) as DeepStrings<T>;
  if (Array.isArray(value))
    return value.map((item) => typesetDeep(item, language)) as DeepStrings<T>;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        typesetDeep(item, language),
      ]),
    ) as DeepStrings<T>;
  return value as DeepStrings<T>;
}
