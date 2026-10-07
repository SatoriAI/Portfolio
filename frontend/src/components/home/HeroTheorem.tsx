import { Link } from "react-router-dom";

/**
 * The hero as a theorem and its proof, side by side and both shown.
 *
 * Left, the theorem: the label, then the statement as one sentence in three
 * set lines, "Mathematician / by training / ∧ engineer by trade.", the
 * logical and (∧) leading the last line, as a line breaks before an operator
 * in mathematics; a screen reader hears the word instead of the symbol.
 *
 * Right, the proof, read top to bottom: every step the same shape, its
 * number, the fact, and under it the link to where the fact is shown; the
 * tombstone, the kit's filled module, closes it in the lower right corner,
 * on the last link's row.
 * The two labels match in size and weight, the proof's set in italic, as in
 * a paper. The theorem takes five columns and the proof seven, so each
 * step fits two lines and the two columns end level; at the narrowest
 * desktops the statement's last line wraps rather than leave a blank under
 * the theorem. On a phone the proof
 * follows the theorem.
 */

export type ProofLine = { text: string; to: string; label: string };

export type HeroTheoremLabels = {
  theorem: string;
  /** The statement's two halves, joined by ∧. */
  statement: readonly string[];
  /** What a screen reader says for ∧. */
  and: string;
  proof: string;
  lines: readonly ProofLine[];
};

const LABEL = "text-lg font-semibold text-iris";

const HeroTheorem = ({ labels }: { labels: HeroTheoremLabels }) => {
  const [first = "", second = ""] = labels.statement;
  // "Matematyk z wykształcenia" → "Matematyk" / "z wykształcenia".
  const [head, ...rest] = first.split(" ");

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-x-6 lg:gap-y-8">
      <div className="lg:col-span-5">
        <p data-circuit-start className={`mb-2 ${LABEL}`}>
          {labels.theorem}
        </p>
        {/* A step smaller from lg to xl, where the statement has five columns:
            at the full size it ran to four lines there. */}
        <h1 className="text-display-sm md:text-display-md lg:max-xl:text-display-sm">
          <span className="block">{head}</span>
          <span className="block">{rest.join(" ")}</span>
          {/* On a phone the last line never wraps: it shrinks with the
              screen (30–36px) rather than break before "z zawodu". */}
          <span className="block max-sm:whitespace-nowrap max-sm:text-[clamp(1.875rem,9.6vw,2.25rem)]">
            <span aria-hidden="true" className="text-iris">
              ∧
            </span>
            <span className="sr-only">{labels.and}</span> {second}.
          </span>
        </h1>
      </div>

      <div className="lg:col-span-7">
        <p className={`mb-3 italic ${LABEL}`}>{labels.proof}</p>
        {/* As wide as the longest step, so the tombstone's corner is the
            proof's own, not the column's. */}
        <div className="w-fit">
          <ol className="space-y-3">
            {labels.lines.map((line, index) => (
              <li key={line.to} className="flex gap-2">
                <span className="w-6 shrink-0 font-mono text-meta leading-[26px] text-muted-foreground">
                  {index + 1}.
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-muted-foreground">{line.text}</span>
                  {/* The last link shares its row with the tombstone, which
                      closes the proof in its lower right corner. */}
                  <span className="flex items-center justify-between gap-4">
                    <Link
                      to={line.to}
                      className="-mb-2 inline-block rounded-sm pb-2 font-mono text-meta text-iris underline decoration-1 underline-offset-4 outline-none transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {line.label} →
                    </Link>
                    {index === labels.lines.length - 1 && (
                      <span aria-hidden="true" className="size-2.5 rounded-motif bg-primary" />
                    )}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HeroTheorem;
