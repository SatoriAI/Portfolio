import { useState } from "react";

import { MathText } from "@/components/Formula";
import { RangeInput } from "@/components/ui/range-input";
import { productExample } from "@/lib/gridAverages";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

export type CovarianceLabels = {
  /** The rows' names; may carry `$…$`. */
  b: string;
  u: string;
  product: string;
  /** Over the column of means. */
  mean: string;
  meanOfProduct: string;
  productOfMeans: string;
  /** The line under the bars; `{c}` is the covariance. */
  gap: string;
  /** The slider's name and its two ends; may carry `$…$`. */
  movement: string;
  opposite: string;
  together: string;
  /** The decimal separator: "," in Polish, "." in English. */
  decimal: string;
};

/** The bars' scale runs to 5, the largest mean of the product the slider reaches. */
const SCALE = 5;

const LIT = "transition-[width,left] duration-200 ease-brand motion-reduce:transition-none";

/**
 * The piece's example, worked: b = 1, 3 and u = 3, 1 on the two halves of a
 * cell. The rows show both, their product and each mean; the bars under them
 * compare the mean of the product with the product of the means, and the
 * gap between the two is the covariance. The reader moves u from against b
 * (the piece's example) through flat to together with it: the product of the
 * means never moves, the mean of the product does, and the gap changes sign
 * with the way u moves. All HTML, so the numbers stay at text size on a
 * phone; the state is the slider's alone, the same at build time and in the
 * browser.
 */
const CovarianceFigure = ({ labels }: { labels: CovarianceLabels }) => {
  // From −1 (u against b, the piece's example) to 1 (u with b), in halves.
  const [movement, setMovement] = useState(-1);
  const example = productExample(-movement);
  const number = (value: number) =>
    (value < 0 ? "−" : "") + String(Math.abs(value)).replace(".", labels.decimal);
  const gapFrom = Math.min(example.meanOfProduct, example.productOfMeans) / SCALE;
  const gapTo = Math.max(example.meanOfProduct, example.productOfMeans) / SCALE;
  const gapLine = fillTemplate(labels.gap, { c: number(example.covariance) });

  const rows = [
    { name: labels.b, values: example.b, mean: example.meanB },
    { name: labels.u, values: example.u, mean: example.meanU },
    { name: labels.product, values: example.product, mean: example.meanOfProduct, lit: true },
  ];
  const bars = [
    { name: labels.meanOfProduct, value: example.meanOfProduct, className: "bg-iris" },
    { name: labels.productOfMeans, value: example.productOfMeans, className: "bg-primary" },
  ];

  return (
    <div>
      <div
        aria-hidden="true"
        className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-3 gap-y-2"
      >
        <span />
        <span />
        <span />
        <span className="text-right font-mono text-meta uppercase tracking-widest text-muted-foreground">
          {labels.mean}
        </span>
        {rows.map((row) => (
          <div key={row.name} className="contents">
            <span className="pr-2 text-base text-foreground">
              <MathText text={row.name} />
            </span>
            {row.values.map((value, i) => (
              <span
                key={i}
                className={cn(
                  "flex h-10 items-center justify-center rounded-motif border font-mono text-base tabular-nums",
                  row.lit
                    ? "border-iris/50 bg-card text-iris"
                    : "border-border bg-card text-foreground",
                )}
              >
                {number(value)}
              </span>
            ))}
            <span
              className={cn(
                "pl-2 text-right font-mono text-base tabular-nums",
                row.lit ? "text-iris" : "text-foreground",
              )}
            >
              → {number(row.mean)}
            </span>
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="mt-8 space-y-3">
        {bars.map((bar) => (
          <div key={bar.name}>
            <div className="flex items-baseline justify-between gap-3 text-sm text-foreground/80">
              <span>{bar.name}</span>
              <span className="font-mono tabular-nums text-foreground">{number(bar.value)}</span>
            </div>
            <div className="relative mt-1 h-2.5">
              {/* The gap between the two values, on both bars' track. */}
              <span
                className={cn("absolute inset-y-0 bg-blush-deep", LIT)}
                style={{ left: `${gapFrom * 100}%`, width: `${(gapTo - gapFrom) * 100}%` }}
              />
              <span
                className={cn("absolute inset-y-0 left-0 rounded-r-motif", bar.className, LIT)}
                style={{ width: `${(bar.value / SCALE) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <p className="flex items-center gap-3 pt-1 text-sm text-foreground/80">
          <span aria-hidden="true" className="h-3 w-6 shrink-0 bg-blush-deep" />
          <span>
            <MathText text={gapLine} />
          </span>
        </p>
      </div>

      <label className="mt-6 block">
        <span className="font-mono text-meta tracking-wide text-foreground">
          <MathText text={labels.movement} />
        </span>
        <RangeInput
          aria-label={labels.movement.replace(/\$/g, "")}
          min={-1}
          max={1}
          step={0.5}
          value={movement}
          onChange={(event) => setMovement(Number(event.target.value))}
          valueText={[
            `${labels.u.replace(/\$/g, "")}: ${example.u.map(number).join(", ")}`,
            `${labels.meanOfProduct} ${number(example.meanOfProduct)}`,
            `${labels.productOfMeans} ${number(example.productOfMeans)}`,
            gapLine.replace(/\$/g, ""),
          ].join(". ")}
        />
        <span className="flex justify-between gap-4 text-xs text-muted-foreground">
          <span>
            <MathText text={labels.opposite} />
          </span>
          <span className="text-right">
            <MathText text={labels.together} />
          </span>
        </span>
      </label>
    </div>
  );
};

export default CovarianceFigure;
