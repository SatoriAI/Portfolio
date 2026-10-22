import { type ComponentType, createElement } from "react";
import {
  Boxes,
  Brain,
  Cloud,
  Code,
  Container,
  Database,
  Infinity as InfinityIcon,
  Network,
  Server,
  Sparkles,
} from "lucide-react";

import BrandMark from "@/components/brand/BrandMark";
import { TECH_ICONS, type TechIcon } from "@/config/techIcons";

/** Anything that draws a skill's icon: a Lucide icon, or a brand mark. */
export type SkillIcon = ComponentType<{ className?: string }>;

/**
 * The icon a skill is drawn with, from the name the backend gives it: the
 * choices of work.choices.Icons (backend/portfolio/work/choices.py), which
 * this mirrors. A skill that is one technology names that technology's mark
 * as config/techIcons names it, the site's one source of them; a skill that
 * is a practice rather than a product names an outline icon from Lucide, the
 * kit's set, since no one brand stands for it. A name neither knows is drawn
 * as Code, so a choice added to the backend first never draws nothing; the
 * test reads choices.py and fails until every choice draws its own icon.
 *
 * The brand marks are drawn in their brand's own colour, so the list reads as
 * the technologies at a glance; the outline icons follow their label. Both
 * the fill and the colour depart from the kit's icon rules on purpose (see
 * the kit's Icons section).
 */

/** A technology's mark as an icon component, made once per mark. */
const brandMark = (name: string, icon: TechIcon): SkillIcon => {
  const Mark: SkillIcon = ({ className }) => createElement(BrandMark, { icon, className });
  Mark.displayName = `${name}Mark`;
  return Mark;
};

const ICONS = new Map<string, SkillIcon>([
  ...Object.entries(TECH_ICONS).map(([name, icon]): [string, SkillIcon] => [
    name,
    brandMark(name, icon),
  ]),
  ["Code", Code],
  ["Database", Database],
  ["Brain", Brain],
  ["Server", Server],
  ["Cloud", Cloud],
  ["Container", Container],
  ["Boxes", Boxes],
  // Generative AI.
  ["Sparkles", Sparkles],
  // System engineering: services talking to each other.
  ["Network", Network],
  // CI/CD: the build-and-deploy loop.
  ["Infinity", InfinityIcon],
]);

export const skillIcon = (name: string): SkillIcon => ICONS.get(name) ?? Code;
