import type { DomainKind } from "@/components/academic/DomainGlyph";

/**
 * What the domain drawings share with the code around them, kept apart from
 * DomainGlyph so that file exports components only (fast refresh needs it).
 */

/**
 * The custom property a parent sets to the scale it draws a glyph at.
 * Registered as a number (in DomainGlyph), so it can be animated along with
 * the transform.
 */
export const GLYPH_SCALE = "--glyph-scale";

/**
 * Papers whose domain no word in the title names, keyed by the link the
 * backend stores for each: the same in every language, unlike the title.
 */
const DOMAIN_BY_LINK: Record<string, DomainKind> = {
  "https://arxiv.org/abs/2610.20106": "darcy",
};

/**
 * Which domain a paper is set on: by its link first, then by what its title
 * names. Two papers are on conic and double conic domains and say so in the
 * title; a paper matched by neither gets no glyph rather than a wrong one.
 */
export const domainFor = ({ title, link }: { title: string; link: string }): DomainKind | null => {
  const byLink = DOMAIN_BY_LINK[link];
  if (byLink) return byLink;
  if (/double|podwójn/i.test(title)) return "double-cone";
  if (/conic|cone|stożk/i.test(title)) return "cone";
  return null;
};
