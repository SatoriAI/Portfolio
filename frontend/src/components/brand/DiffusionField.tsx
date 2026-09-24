import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Static grain rendered once into a small tile and repeated, instead of a
// full-size feTurbulence filter that mobile Safari repaints slowly.
const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.09 0 0 0 0 0.14 0 0 0 0 0.24 0 0 0 1 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>',
)}")`;

// Two asymmetric colour sources fading to the page background by roughly two
// thirds of their reach. The deep tints are illustration colours from the kit
// and appear nowhere else.
//
// Placement matters because the field clips at its own edges, and a source
// sitting on an edge terminates at full strength — a visible band. `corners`
// puts the lavender on the bottom edge, which suits a section that ends the
// page. `top` keeps both sources against the top, where the fixed header
// already draws a hard line, and leaves the lower edge clear so the field can
// dissolve into whatever follows.
export type DiffusionPlacement = "corners" | "top";

const FIELDS: Record<DiffusionPlacement, string> = {
  corners: [
    "radial-gradient(ellipse 70% 75% at 8% 100%, hsl(var(--lavender-deep) / 0.75) 0%, hsl(var(--lavender) / 0.5) 35%, transparent 65%)",
    "radial-gradient(ellipse 70% 75% at 92% 0%, hsl(var(--blush-deep) / 0.7) 0%, hsl(var(--blush) / 0.5) 35%, transparent 65%)",
  ].join(", "),
  // The alphas here are the strongest the hero can carry. Measured against the
  // composited background at 375px, where the copy spans the full width and so
  // sits nearest the sources, the weakest element is the 13px iris eyebrow at
  // 4.94:1 against the 4.5:1 that AA asks of it. Raising them to 0.70/0.45
  // takes that to 4.79:1, which passes but leaves nothing for a later tweak.
  top: [
    "radial-gradient(ellipse 62% 68% at 6% 0%, hsl(var(--lavender-deep) / 0.62) 0%, hsl(var(--lavender) / 0.41) 32%, transparent 66%)",
    "radial-gradient(ellipse 58% 62% at 94% 2%, hsl(var(--blush-deep) / 0.58) 0%, hsl(var(--blush) / 0.4) 32%, transparent 64%)",
  ].join(", "),
};

const grainStyle: CSSProperties = {
  backgroundImage: GRAIN_TILE,
  backgroundSize: "160px 160px",
  opacity: 0.06,
  mixBlendMode: "multiply",
};

type DiffusionFieldProps = HTMLAttributes<HTMLDivElement> & {
  /** Where the two colour sources sit. See FIELDS for why this is not free-form. */
  placement?: DiffusionPlacement;
};

/**
 * The kit's complementary motif: soft asymmetric lavender and blush fields
 * with a faint matte grain. Content renders above, on the calm light centre.
 */
const DiffusionField = ({
  placement = "corners",
  className,
  children,
  ...props
}: DiffusionFieldProps) => (
  <div className={cn("relative isolate overflow-hidden bg-background", className)} {...props}>
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10"
      style={{ backgroundImage: FIELDS[placement] }}
    />
    <div aria-hidden="true" className="absolute inset-0 -z-10" style={grainStyle} />
    {children}
  </div>
);

export default DiffusionField;
