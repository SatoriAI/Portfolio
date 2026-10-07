import { cn } from "@/lib/utils";

/**
 * Artwork box below which the kit requires the heavier micro cut. The kit is
 * explicit that small sizes must not be produced by shrinking the standard
 * drawing, so the threshold lives here rather than at each call site.
 */
const MICRO_BELOW_PX = 32;

export type SymbolCut = "standard" | "micro";

/**
 * Geometry transcribed verbatim from the kit masters: `symbol/dh-*.svg` for the
 * standard cut and `favicon/favicon.svg` for the micro one. The micro cut is a
 * separate drawing with a heavier stroke, not a scaled copy.
 *
 * `0 · 1 → dh`: the bowl reads as zero, the shared vertical as one, and the
 * shoulder completes the `h`. Proportions and stroke weights are fixed by the
 * kit and must not be altered.
 */
const CUTS: Record<SymbolCut, { strokeWidth: number; bowl: string; shoulder: string }> = {
  standard: {
    strokeWidth: 8.5,
    bowl: "M49 18V77H31A17.5 17.5 0 0 1 31 42H49",
    shoulder: "M49 57C55 43 75 42 82 55V77",
  },
  micro: {
    strokeWidth: 10,
    bowl: "M49 17V78H31A18 18 0 0 1 31 42H49",
    shoulder: "M49 58C56 43 76 42 83 56V78",
  },
};

type BrandSymbolProps = {
  /** Height of the symbol's artwork box in pixels. The kit's minimum is 32. */
  size?: number;
  /** Overrides the cut that `size` would otherwise select. */
  cut?: SymbolCut;
  className?: string;
};

/**
 * The Binary Axis symbol, drawn inline so it takes the current text colour.
 * The mark stays single-colour: callers choose the colour, never the strokes.
 */
export const BrandSymbol = ({ size = 36, cut, className }: BrandSymbolProps) => {
  const { strokeWidth, bowl, shoulder } =
    CUTS[cut ?? (size < MICRO_BELOW_PX ? "micro" : "standard")];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={bowl} />
        <path d={shoulder} />
      </g>
    </svg>
  );
};

/**
 * Lockup proportions, as multiples of the symbol's artwork box, measured from
 * the master `logo/dawid-hanrahan-navy.svg` (viewBox 315×120, symbol box 100
 * units at x8): wordmark cap height 23.04, baselines at y54 and y94, wordmark
 * ink starting at x135.25. Manrope's cap height is 0.72em, so the font size is
 * 0.2304 / 0.72.
 *
 * The wordmark is live text rather than the kit's outlined paths so it inherits
 * `currentColor`, stays selectable, and costs nothing to download.
 */
const WORDMARK_FONT_SIZE = 0.32;
const WORDMARK_LINE_HEIGHT = 0.4;
const WORDMARK_GAP = 0.2725;

type BrandLogoProps = {
  /** Full logo (symbol + two-line wordmark) or the symbol alone. */
  variant?: "full" | "symbol";
  /** Height of the symbol's artwork box in pixels. */
  size?: number;
  className?: string;
};

const BrandLogo = ({ variant = "full", size = 36, className }: BrandLogoProps) => (
  <span
    className={cn("inline-flex items-center text-current", className)}
    style={variant === "full" ? { gap: size * WORDMARK_GAP } : undefined}
  >
    <BrandSymbol size={size} />
    {variant === "full" && (
      <span
        className="flex flex-col font-semibold tracking-tight"
        style={{
          fontSize: size * WORDMARK_FONT_SIZE,
          lineHeight: `${size * WORDMARK_LINE_HEIGHT}px`,
        }}
      >
        <span>Dawid</span>
        <span>Hanrahan</span>
      </span>
    )}
  </span>
);

export default BrandLogo;
