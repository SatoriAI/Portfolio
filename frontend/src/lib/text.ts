/** Two digits, as the site numbers its sections and steps: 3 → "03". */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** A position in a sequence, as the eyebrows and steppers show it: "01 / 04". */
export const formatCounter = (index: number, total: number) => `${pad2(index)} / ${pad2(total)}`;

/**
 * A translated sentence with its `{name}` slots filled: every slot, each as
 * often as it appears. A slot without a value is left as it is, so a missing
 * one shows while writing rather than as an empty gap.
 */
export const fillTemplate = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (slot, name: string) =>
    name in values ? String(values[name]) : slot,
  );

/**
 * A line cut before its last word, so whatever follows it (an arrow, a
 * cursor) can be kept on the same line as that word: "a b c" → ["a b ", "c"].
 */
export const splitLastWord = (text: string): [head: string, last: string] => {
  const at = text.lastIndexOf(" ") + 1;
  return [text.slice(0, at), text.slice(at)];
};

/** Text split into its paragraphs at blank lines, as it was written. */
export const paragraphsOf = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
