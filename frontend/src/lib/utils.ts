import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge told about the kit's own scale (tailwind.config.ts). Left
 * alone it reads an unknown `text-*` as a colour, so `text-meta
 * text-muted-foreground` lost its size and set the text at 16px, and an
 * unknown `shadow-*` or `rounded-*` never overrode the one before it. Keep
 * these lists in step with fontSize, boxShadow and borderRadius there.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "display-sm",
            "display-md",
            "h2",
            "h2-sm",
            "card-title",
            "card-title-sm",
            "body-lg",
            "meta",
          ],
        },
      ],
      shadow: [{ shadow: ["lift", "float", "press", "rim", "rim-focus"] }],
      rounded: [{ rounded: ["card", "motif"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
