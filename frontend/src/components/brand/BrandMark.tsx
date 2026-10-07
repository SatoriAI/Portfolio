import type { Ref } from "react";

import type { TechIcon } from "@/config/techIcons";

/**
 * A brand's mark from config/techIcons, in the brand's own colour.
 * Decorative: a name always stands beside it.
 */
const BrandMark = ({
  icon,
  className,
  markRef,
}: {
  icon: TechIcon;
  className?: string;
  markRef?: Ref<SVGSVGElement>;
}) => (
  <svg ref={markRef} aria-hidden="true" viewBox="0 0 24 24" fill={icon.hex} className={className}>
    <path d={icon.path} />
  </svg>
);

export default BrandMark;
