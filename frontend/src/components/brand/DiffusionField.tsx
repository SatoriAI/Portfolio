import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Static grain rendered once into a small tile and repeated, instead of a
// full-size feTurbulence filter that mobile Safari repaints slowly.
const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.09 0 0 0 0 0.14 0 0 0 0 0.24 0 0 0 1 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>',
)}")`;

// Two asymmetric colour sources at opposite corners, fading to the page
// background by roughly two thirds of their reach. The deep tints are
// illustration colours from the kit and appear nowhere else.
const fieldStyle: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 70% 75% at 8% 100%, hsl(var(--lavender-deep) / 0.75) 0%, hsl(var(--lavender) / 0.5) 35%, transparent 65%)",
    "radial-gradient(ellipse 70% 75% at 92% 0%, hsl(var(--blush-deep) / 0.7) 0%, hsl(var(--blush) / 0.5) 35%, transparent 65%)",
  ].join(", "),
};

const grainStyle: CSSProperties = {
  backgroundImage: GRAIN_TILE,
  backgroundSize: "160px 160px",
  opacity: 0.06,
  mixBlendMode: "multiply",
};

type DiffusionFieldProps = HTMLAttributes<HTMLDivElement>;

/**
 * The kit's complementary motif: soft asymmetric lavender and blush fields
 * with a faint matte grain. Content renders above, on the calm light centre.
 */
const DiffusionField = ({ className, children, ...props }: DiffusionFieldProps) => (
  <div className={cn("relative isolate overflow-hidden bg-background", className)} {...props}>
    <div aria-hidden="true" className="absolute inset-0 -z-10" style={fieldStyle} />
    <div aria-hidden="true" className="absolute inset-0 -z-10" style={grainStyle} />
    {children}
  </div>
);

export default DiffusionField;
