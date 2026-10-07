import { Formula } from "@/components/Formula";
import { EXPECTED_HITS, SEARCH_VARIANTS, type SearchVariant } from "@/lib/searchEvaluation";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * Each piece's evidence in small, by the name its header gives as `figure`:
 * the result the piece is about, shown where the piece is listed. Shared by
 * the home page's card and the workshop index. Still drawings; on the index,
 * pointing at or focusing a piece's row lights the one mark that carries its
 * result (`group/piece`), which is that page's own reading.
 */

export type ExhibitLabels = {
  /** The grokking plot's legend and band. */
  newExamples: string;
  training: string;
  delay: string;
  /** The search evaluation's rows and columns. */
  variants: Record<SearchVariant["key"], string>;
  hits: string;
  falseHits: string;
  /** `{n}` is the number of expected hits. */
  searchNote: string;
  /** The line under the heat identity. */
  heatCaption: string;
};

const LIT = "transition-colors duration-200 motion-reduce:transition-none";

export const SearchBars = ({ labels }: { labels: ExhibitLabels }) => (
  <div aria-hidden="true">
    <div className="grid grid-cols-[1fr_3rem_2rem] gap-x-3 font-mono text-meta uppercase tracking-widest text-muted-foreground">
      <span />
      <span className="text-right">{labels.hits}</span>
      <span className="text-right">{labels.falseHits}</span>
    </div>
    <ul className="mt-1 space-y-3">
      {SEARCH_VARIANTS.map((variant) => {
        const share = variant.hits / EXPECTED_HITS;
        return (
          <li
            key={variant.key}
            className="grid grid-cols-[1fr_3rem_2rem] items-end gap-x-3 text-sm tabular-nums"
          >
            <span className="min-w-0">
              <span
                className={cn(
                  "block",
                  variant.chosen ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {labels.variants[variant.key]}
              </span>
              <span className="mt-1 block h-1.5 rounded-motif bg-lavender/60">
                <span
                  style={{ width: `${share * 100}%` }}
                  className={cn(
                    "block h-full rounded-motif",
                    LIT,
                    variant.chosen
                      ? "bg-lavender-deep group-focus-within/piece:bg-iris group-hover/piece:bg-iris"
                      : "bg-lavender",
                  )}
                />
              </span>
            </span>
            <span className="text-right">{Math.round(share * 100)}%</span>
            <span className="text-right">{variant.falseHits}</span>
          </li>
        );
      })}
    </ul>
    <p className="mt-3 font-mono text-meta text-muted-foreground">
      {fillTemplate(labels.searchNote, { n: EXPECTED_HITS })}
    </p>
  </div>
);

export const HeatIdentity = ({ labels }: { labels: ExhibitLabels }) => (
  <div aria-hidden="true" className="text-center">
    <p className="text-2xl">
      <Formula tex="\frac{P_t(bu) − (P_t b)(P_t u)}{2t}" />{" "}
      <span
        className={cn(
          "whitespace-nowrap",
          LIT,
          "group-focus-within/piece:text-iris group-hover/piece:text-iris",
        )}
      >
        <Formula tex="→ ∇b · ∇u" />
      </span>
    </p>
    <p className="mt-4 text-sm text-muted-foreground">{labels.heatCaption}</p>
  </div>
);
