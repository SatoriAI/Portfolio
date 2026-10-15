import { forwardRef } from "react";

import type { TechIcon } from "@/config/techIcons";
import { useTheme } from "@/contexts/SettingsContext";

/** Relative luminance of a #RRGGBB colour (WCAG 2). */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The dark theme's surface, #161F33. */
const DARK_SURFACE = luminance("#161F33");

/**
 * A brand's mark from config/techIcons, in the brand's own colour.
 * Decorative: a name always stands beside it. In the dark theme a mark that
 * would fall under 3:1 on the surface (the black and near-black ones) takes
 * the text colour instead, as the practices without a brand do.
 */
const BrandMark = forwardRef<SVGSVGElement, { icon: TechIcon; className?: string }>(
  ({ icon, className }, ref) => {
    const theme = useTheme();
    const mark = luminance(icon.hex);
    const ratio = (Math.max(mark, DARK_SURFACE) + 0.05) / (Math.min(mark, DARK_SURFACE) + 0.05);
    const fades = theme === "dark" && ratio < 3;
    return (
      <svg
        ref={ref}
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill={fades ? "currentColor" : icon.hex}
        className={className}
      >
        <path d={icon.path} />
      </svg>
    );
  },
);
BrandMark.displayName = "BrandMark";

export default BrandMark;
