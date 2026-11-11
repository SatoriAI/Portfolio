import { Fragment, useMemo } from "react";

import { type FormulaNode, parseFormula, splitEmphasis, splitMath } from "@/lib/formula";
import { cn } from "@/lib/utils";

/**
 * A formula, set as one. The notation is the small TeX-like subset in
 * lib/formula; the output is MathML, which every current browser lays out
 * natively — real subscripts, real fractions, no library and no font to
 * download. A formula that the grammar cannot parse falls back to its source
 * text in mono rather than an empty element, and the tests keep that path
 * cold.
 */

const FENCES = new Set(["(", ")", "[", "]", "|", "⟨", "⟩", "/"]);
const CLOSES: Record<string, string> = { "(": ")", "[": "]" };

const holdsFraction = (node: FormulaNode): boolean =>
  node.type === "frac" || (node.type === "row" && node.children.some(holdsFraction));

/** The fence a node stands for: itself, or the base a script hangs on, as in `)^2`. */
const fenceOf = (node: FormulaNode): string | undefined =>
  node.type === "op"
    ? node.value
    : (node.type === "sub" || node.type === "sup") && node.base.type === "op"
      ? node.base.value
      : undefined;

/**
 * The round and square brackets of a row that enclose a fraction, by
 * position. Those grow to the fraction's height; every other fence keeps the
 * height of the line. A closing bracket may carry a script.
 */
const tallFences = (children: FormulaNode[]): Set<number> => {
  const tall = new Set<number>();
  const open: number[] = [];
  children.forEach((child, index) => {
    const fence = fenceOf(child);
    if (fence === undefined) return;
    if (child.type === "op" && fence in CLOSES) {
      open.push(index);
      return;
    }
    const from = open[open.length - 1];
    const opener = from === undefined ? undefined : fenceOf(children[from]);
    if (opener === undefined || CLOSES[opener] !== fence) return;
    open.pop();
    if (children.slice(from + 1, index).some(holdsFraction)) tall.add(from).add(index);
  });
  return tall;
};

const render = (node: FormulaNode, key = 0, tall = false): JSX.Element => {
  switch (node.type) {
    case "row": {
      const fences = tallFences(node.children);
      return (
        <mrow key={key}>
          {node.children.map((child, index) => render(child, index, fences.has(index)))}
        </mrow>
      );
    }
    case "id":
      // ∇ is upright, as in print; a single-letter mi is otherwise italic.
      return (
        <mi key={key} mathvariant={node.value === "∇" ? "normal" : undefined}>
          {node.value}
        </mi>
      );
    case "num":
      return <mn key={key}>{node.value}</mn>;
    case "op":
      // Fences and the solidus set tight; MathML's default operator spacing
      // would put air inside |0⟩ and around 1/π.
      return FENCES.has(node.value) ? (
        <mo key={key} stretchy={tall ? undefined : "false"} lspace="0" rspace="0">
          {node.value}
        </mo>
      ) : (
        <mo key={key}>{node.value}</mo>
      );
    case "text":
      return <mtext key={key}>{node.value}</mtext>;
    case "sub":
      return (
        <msub key={key}>
          {render(node.base, 0, tall)}
          {render(node.sub, 1)}
        </msub>
      );
    case "sup":
      return (
        <msup key={key}>
          {render(node.base, 0, tall)}
          {render(node.sup, 1)}
        </msup>
      );
    case "frac":
      return (
        <mfrac key={key}>
          {render(node.num, 0)}
          {render(node.den, 1)}
        </mfrac>
      );
  }
};

type FormulaProps = {
  /** The formula, e.g. `K_t(x, y)` or `\frac{2π · k · a}{113}`. */
  tex: string;
  className?: string;
  /** A formula on a line of its own, set at full size rather than inline. */
  block?: boolean;
};

export const Formula = ({ tex, className, block = false }: FormulaProps) => {
  const tree = useMemo(() => {
    try {
      return parseFormula(tex);
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [tex]);

  if (!tree) return <code className={cn("font-mono", className)}>{tex}</code>;
  return (
    <math display={block ? "block" : "inline"} className={cn("formula", className)}>
      {render(tree)}
    </math>
  );
};

type MathTextProps = {
  /**
   * Prose with inline formulas between dollar signs, `the kernel $K_t(x, y)$`,
   * and emphasis between asterisks, `called *grokking*`.
   */
  text: string;
};

/** The punctuation that closes a clause, at the start of the prose after a formula. */
const TRAILING = /^[,.;:!?)]+/;

/**
 * Prose that may carry formulas and emphasis; the plain runs are rendered as
 * they are. Punctuation straight after a formula stays on the formula's line:
 * a browser may break between a formula and the text after it, and a comma
 * would otherwise open the next line.
 */
export const MathText = ({ text }: MathTextProps) => {
  const segments = splitMath(text);
  return (
    <>
      {segments.map((segment, index) => {
        // Only prose gives up its punctuation: a second formula keeps its own.
        const after = segments[index + 1];
        const trailing =
          segment.math && after && !after.math ? (TRAILING.exec(after.value)?.[0] ?? "") : "";
        const value =
          !segment.math && segments[index - 1]?.math
            ? segment.value.replace(TRAILING, "")
            : segment.value;
        return segment.math ? (
          trailing ? (
            <span key={index} className="whitespace-nowrap">
              <Formula tex={segment.value} />
              {trailing}
            </span>
          ) : (
            <Formula key={index} tex={segment.value} />
          )
        ) : (
          <Fragment key={index}>
            {splitEmphasis(value).map((run, runIndex) =>
              run.em ? (
                <em key={runIndex}>{run.value}</em>
              ) : (
                <Fragment key={runIndex}>{run.value}</Fragment>
              ),
            )}
          </Fragment>
        );
      })}
    </>
  );
};

export default Formula;
