import { Cloud, Infinity as InfinityIcon, Network, Sparkles } from "lucide-react";

import BrandMark from "@/components/brand/BrandMark";
import { TECH_ICONS, type TechName } from "@/config/techIcons";
import type { SkillIcon } from "@/lib/skillsService";

/**
 * The icon each skill is drawn with, keyed by the skill's backend id. A skill
 * that is one technology gets that technology's own mark (config/techIcons,
 * the site's one source of them); a skill that is a practice rather than a
 * product keeps an outline icon from Lucide, the kit's set, since no one
 * brand stands for it. A skill not listed falls back to the backend's icon.
 *
 * The brand marks are drawn in their brand's own colour, so the list reads as
 * the technologies at a glance; the outline icons follow their label. Both
 * the fill and the colour depart from the kit's icon rules on purpose (see
 * the kit's Icons section).
 */

/** A technology's mark (config/techIcons) as an icon component. */
const brandMark = (name: TechName): SkillIcon => {
  const icon = TECH_ICONS[name];
  const Mark: SkillIcon = ({ className }) => <BrandMark icon={icon} className={className} />;
  Mark.displayName = `${name}Mark`;
  return Mark;
};

export const skillIcons: Readonly<Record<number, SkillIcon>> = {
  1: brandMark("Python"),
  2: brandMark("PostgreSQL"),
  3: brandMark("Docker"),
  // System engineering: services talking to each other.
  4: Network,
  5: Sparkles,
  6: brandMark("Kubernetes"),
  // CI/CD: the build-and-deploy loop.
  7: InfinityIcon,
  8: Cloud,
  9: brandMark("React"),
  10: brandMark("Claude"),
  11: brandMark("Cursor"),
  12: brandMark("Redis"),
};
