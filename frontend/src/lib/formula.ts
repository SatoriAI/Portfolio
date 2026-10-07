/**
 * A small TeX-like notation for the formulas the site sets, parsed into a
 * tree that renders as MathML. It covers what a portfolio needs and nothing
 * more: identifiers, numbers, operators, `_` and `^` with a single token or a
 * `{group}`, `\frac{a}{b}`, and `\text{words}`. Anything else is an error at
 * parse time, which the tests catch, rather than a silent mis-render.
 *
 * Kept out of the component so the grammar can be tested in node.
 */

export type FormulaNode =
  | { type: "row"; children: FormulaNode[] }
  | { type: "id"; value: string }
  | { type: "num"; value: string }
  | { type: "op"; value: string }
  | { type: "text"; value: string }
  | { type: "sub"; base: FormulaNode; sub: FormulaNode }
  | { type: "sup"; base: FormulaNode; sup: FormulaNode }
  | { type: "frac"; num: FormulaNode; den: FormulaNode };

type Token =
  | { kind: "id" | "num" | "op" | "text"; value: string }
  | { kind: "open" | "close" | "sub" | "sup" | "frac" };

const NUMBER = /^\d+(?:[.,]\d+)?/;
// A letter of any script counts as an identifier: Latin, Greek, blackboard,
// and ∂ and ∇, which set tight against what they differentiate as a letter does.
const LETTER = /^[\p{L}ℤℝℂℕ∂∇∞]/u;
const OPERATOR = /^(?:→|←|·|×|±|−|≤|≥|≡|[-+=<>,;:()[\]|/!'.]|⟨|⟩|∑|∫)/u;

const tokenize = (source: string): Token[] => {
  const tokens: Token[] = [];
  let rest = source;
  while (rest.length > 0) {
    if (/^\s/.test(rest)) {
      rest = rest.slice(1);
    } else if (rest.startsWith("\\frac")) {
      tokens.push({ kind: "frac" });
      rest = rest.slice(5);
    } else if (rest.startsWith("\\text{")) {
      const end = rest.indexOf("}", 6);
      if (end < 0) throw new Error(`Unterminated \\text in "${source}"`);
      // MathML trims the ends of a text run, so a space meant to separate
      // "mod" from what follows has to be a non-breaking one.
      tokens.push({ kind: "text", value: rest.slice(6, end).replace(/ /g, "\u00A0") });
      rest = rest.slice(end + 1);
    } else if (rest.startsWith("{")) {
      tokens.push({ kind: "open" });
      rest = rest.slice(1);
    } else if (rest.startsWith("}")) {
      tokens.push({ kind: "close" });
      rest = rest.slice(1);
    } else if (rest.startsWith("_")) {
      tokens.push({ kind: "sub" });
      rest = rest.slice(1);
    } else if (rest.startsWith("^")) {
      tokens.push({ kind: "sup" });
      rest = rest.slice(1);
    } else {
      const number = NUMBER.exec(rest);
      const operator = OPERATOR.exec(rest);
      const letter = LETTER.exec(rest);
      if (number) {
        tokens.push({ kind: "num", value: number[0] });
        rest = rest.slice(number[0].length);
      } else if (operator) {
        tokens.push({ kind: "op", value: operator[0] });
        rest = rest.slice(operator[0].length);
      } else if (letter) {
        tokens.push({ kind: "id", value: letter[0] });
        rest = rest.slice(letter[0].length);
      } else {
        throw new Error(`Unexpected "${rest[0]}" in formula "${source}"`);
      }
    }
  }
  return tokens;
};

const row = (children: FormulaNode[]): FormulaNode =>
  children.length === 1 ? children[0] : { type: "row", children };

/** Parses one formula. Throws on notation the grammar does not know. */
export function parseFormula(source: string): FormulaNode {
  const tokens = tokenize(source);
  let position = 0;

  const peek = () => tokens[position];
  const next = () => tokens[position++];

  // One operand: a token, or a braced group, or \frac with two operands.
  const atom = (): FormulaNode => {
    const token = next();
    if (!token) throw new Error(`Formula "${source}" ends early`);
    switch (token.kind) {
      case "open": {
        const inner = sequence();
        if (next()?.kind !== "close") throw new Error(`Missing } in "${source}"`);
        return inner;
      }
      case "frac":
        return { type: "frac", num: atom(), den: atom() };
      case "id":
      case "num":
      case "op":
      case "text":
        return { type: token.kind, value: token.value };
      default:
        throw new Error(`Unexpected token in "${source}"`);
    }
  };

  // An atom followed by any number of scripts.
  const scripted = (): FormulaNode => {
    let base = atom();
    while (peek()?.kind === "sub" || peek()?.kind === "sup") {
      const kind = next()!.kind;
      const script = atom();
      base =
        kind === "sub" ? { type: "sub", base, sub: script } : { type: "sup", base, sup: script };
    }
    return base;
  };

  const sequence = (): FormulaNode => {
    const children: FormulaNode[] = [];
    while (peek() && peek()!.kind !== "close") children.push(scripted());
    return row(children);
  };

  const result = sequence();
  if (position < tokens.length) throw new Error(`Unbalanced } in "${source}"`);
  return result;
}

/**
 * Splits prose on `$…$` into text and formula segments. An unmatched `$`
 * is left as text, so a price in a paragraph cannot break the page.
 */
export const splitMath = (text: string): { math: boolean; value: string }[] => {
  const segments: { math: boolean; value: string }[] = [];
  const pattern = /\$([^$]+)\$/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > last) segments.push({ math: false, value: text.slice(last, match.index) });
    segments.push({ math: true, value: match[1] });
    last = match.index! + match[0].length;
  }
  if (last < text.length) segments.push({ math: false, value: text.slice(last) });
  return segments;
};

/**
 * Splits a run of prose on `*…*` into plain and emphasised segments. The
 * asterisks must hug the words, so a lone `*` or `5 * 3 * 4` stays text.
 * Meant for the plain runs `splitMath` returns: emphasis and formulas do not
 * nest.
 */
export const splitEmphasis = (text: string): { em: boolean; value: string }[] =>
  text
    .split(/\*(\S(?:[^*]*\S)?)\*/)
    .map((value, index) => ({ em: index % 2 === 1, value }))
    .filter((segment) => segment.value !== "");
