import { createContext, forwardRef, type ReactNode, useContext, useMemo } from "react";

import { type TechIcon, techIconId } from "@/config/techIcons";
import { cn } from "@/lib/utils";

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

/** The marks the nearest BrandSprite defines, each drawn there once. */
const SpriteMarks = createContext<ReadonlySet<TechIcon>>(new Set());

/**
 * Defines `icons` once each, as symbols in a hidden SVG, for every
 * BrandMark inside it to draw by reference: the home page shows the same
 * stacks in every project's panel, and a mark's path written out each time
 * (PostgreSQL's is 5 KB) made up most of its HTML. Rendered by the content
 * that uses the marks, from the same data on both sides, so the browser's
 * takeover matches the build's page and a page navigated to brings its own.
 * The SVG takes no space; the symbols carry no fill, so each mark keeps the
 * colour its own <svg> gives it.
 */
export const BrandSprite = ({
  icons,
  children,
}: {
  icons: readonly (TechIcon | undefined)[];
  children: ReactNode;
}) => {
  const marks = useMemo(
    () => new Set(icons.filter((icon): icon is TechIcon => !!icon && !!techIconId(icon))),
    [icons],
  );
  return (
    <SpriteMarks.Provider value={marks}>
      <svg aria-hidden="true" className="pointer-events-none absolute size-0 overflow-hidden">
        <defs>
          {[...marks].map((icon) => (
            <symbol key={techIconId(icon)} id={techIconId(icon)} viewBox="0 0 24 24">
              <path d={icon.path} />
            </symbol>
          ))}
        </defs>
      </svg>
      {children}
    </SpriteMarks.Provider>
  );
};

/**
 * A brand's mark from config/techIcons, in the brand's own colour: by
 * reference to the BrandSprite around it when that defines it, written out
 * otherwise. Decorative: a name always stands beside it. In the dark theme a
 * mark that would fall under 3:1 on the surface (the black and near-black
 * ones) takes the text colour instead, as the practices without a brand do:
 * chosen in CSS by the theme on the page, so the HTML rendered at build
 * time, before anyone's theme is known, is right in both. The fill is set on
 * this <svg> and inherited by the path, written out or referenced alike.
 */
const BrandMark = forwardRef<SVGSVGElement, { icon: TechIcon; className?: string }>(
  ({ icon, className }, ref) => {
    const inSprite = useContext(SpriteMarks).has(icon);
    const mark = luminance(icon.hex);
    const ratio = (Math.max(mark, DARK_SURFACE) + 0.05) / (Math.min(mark, DARK_SURFACE) + 0.05);
    return (
      <svg
        ref={ref}
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill={icon.hex}
        className={cn(ratio < 3 && "dark:fill-current", className)}
      >
        {inSprite ? <use href={`#${techIconId(icon)}`} /> : <path d={icon.path} />}
      </svg>
    );
  },
);
BrandMark.displayName = "BrandMark";

export default BrandMark;
