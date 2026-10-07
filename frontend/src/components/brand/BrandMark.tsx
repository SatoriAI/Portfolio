import { forwardRef } from "react";

import type { TechIcon } from "@/config/techIcons";

/**
 * A brand's mark from config/techIcons, in the brand's own colour.
 * Decorative: a name always stands beside it.
 */
const BrandMark = forwardRef<SVGSVGElement, { icon: TechIcon; className?: string }>(
  ({ icon, className }, ref) => (
    <svg ref={ref} aria-hidden="true" viewBox="0 0 24 24" fill={icon.hex} className={className}>
      <path d={icon.path} />
    </svg>
  ),
);
BrandMark.displayName = "BrandMark";

export default BrandMark;
