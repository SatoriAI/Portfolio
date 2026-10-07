/**
 * A text's sentences, split at a full stop, question or exclamation mark
 * followed by a space and a capital letter. The capital is what keeps a
 * Polish abbreviation ("tj. na stożku", "tzw. domains") inside its sentence.
 */
export const sentencesOf = (text: string): string[] =>
  text
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/u)
    .filter(Boolean);

/** The first `count` sentences and the rest, each joined back with spaces. */
export const splitSentences = (text: string, count: number): [string, string] => {
  const sentences = sentencesOf(text);
  return [sentences.slice(0, count).join(" "), sentences.slice(count).join(" ")];
};
