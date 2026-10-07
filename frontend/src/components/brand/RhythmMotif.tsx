import { cn } from "@/lib/utils";

export type RhythmModule = "square" | "lines" | "dot" | "arch";

type RhythmMotifProps = {
  /** Module sequence, 4–8 long. Defaults to the kit's mixed rhythm. */
  modules?: readonly RhythmModule[];
  /** Index of the single navy-filled module that breaks the rhythm. */
  accentIndex?: number;
  /** Gap between modules in px; the kit allows 8–12. */
  gap?: number;
  className?: string;
};

const MODULE = 24;
const RADIUS = 3;
const DOT_RADIUS = MODULE / 6; // "about a third of the module width" in diameter

const DEFAULT_MODULES: readonly RhythmModule[] = [
  "square",
  "lines",
  "square",
  "dot",
  "lines",
  "square",
  "lines",
  "arch",
];

/**
 * The kit's geometric motif: squares, short parallel lines and dots on a
 * regular 24px grid, with one filled navy module drawing the eye. Purely
 * decorative — it never encodes data.
 */
const RhythmMotif = ({
  modules = DEFAULT_MODULES,
  accentIndex = 2,
  gap = 10,
  className,
}: RhythmMotifProps) => {
  const width = modules.length * MODULE + (modules.length - 1) * gap;

  return (
    <svg
      viewBox={`0 0 ${width} ${MODULE}`}
      width={width}
      height={MODULE}
      aria-hidden="true"
      focusable="false"
      className={cn("block h-6 w-auto max-w-full", className)}
    >
      {modules.map((kind, index) => {
        const x = index * (MODULE + gap);
        const accent = index === accentIndex;
        const key = `${kind}-${index}`;

        switch (kind) {
          case "square":
            return (
              <rect
                key={key}
                x={x + 0.5}
                y={0.5}
                width={MODULE - 1}
                height={MODULE - 1}
                rx={RADIUS}
                className={accent ? "fill-primary stroke-primary" : "fill-lavender stroke-iris"}
                strokeWidth={1}
              />
            );
          case "lines":
            return (
              <g key={key} className={accent ? "stroke-primary" : "stroke-iris"} strokeWidth={1}>
                {[4, 12, 20].map((offset) => (
                  <line key={offset} x1={x + offset} y1={2} x2={x + offset} y2={MODULE - 2} />
                ))}
              </g>
            );
          case "dot":
            return (
              <circle
                key={key}
                cx={x + MODULE / 2}
                cy={MODULE / 2}
                r={DOT_RADIUS}
                className={accent ? "fill-primary" : "fill-iris"}
              />
            );
          case "arch":
            return (
              <path
                key={key}
                d={`M${x} ${MODULE} V${MODULE / 2} A${MODULE / 2} ${MODULE / 2} 0 0 1 ${x + MODULE} ${MODULE / 2} V${MODULE} Z`}
                className={accent ? "fill-primary" : "fill-blush"}
              />
            );
        }
      })}
    </svg>
  );
};

export default RhythmMotif;
