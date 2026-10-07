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

const render = (node: FormulaNode, key = 0): JSX.Element => {
  switch (node.type) {
    case "row":
      return <mrow key={key}>{node.children.map((child, index) => render(child, index))}</mrow>;
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
        <mo key={key} stretchy="false" lspace="0" rspace="0">
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
          {render(node.base, 0)}
          {render(node.sub, 1)}
        </msub>
      );
    case "sup":
      return (
        <msup key={key}>
          {render(node.base, 0)}
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

/** Prose that may carry formulas and emphasis; the plain runs are rendered as they are. */
export const MathText = ({ text }: MathTextProps) => (
  <>
    {splitMath(text).map((segment, index) =>
      segment.math ? (
        <Formula key={index} tex={segment.value} />
      ) : (
        <Fragment key={index}>
          {splitEmphasis(segment.value).map((run, runIndex) =>
            run.em ? (
              <em key={runIndex}>{run.value}</em>
            ) : (
              <Fragment key={runIndex}>{run.value}</Fragment>
            ),
          )}
        </Fragment>
      ),
    )}
  </>
);

export default Formula;
