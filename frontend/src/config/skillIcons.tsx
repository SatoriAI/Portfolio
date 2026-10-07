import { Cloud, Infinity as InfinityIcon, Network, Sparkles } from "lucide-react";
import {
  siClaude,
  siDocker,
  siKubernetes,
  type SimpleIcon,
  siPostgresql,
  siPython,
  siReact,
} from "simple-icons";

import type { SkillIcon } from "@/lib/skillsService";

/**
 * The icon each skill is drawn with, keyed by the skill's backend id. A skill
 * that is one technology gets that technology's own mark (from Simple Icons,
 * CC0); a skill that is a practice rather than a product keeps an outline
 * icon from Lucide, the kit's set, since no one brand stands for it. A skill
 * not listed falls back to the backend's icon.
 *
 * The brand marks are drawn in their brand's own colour, so the list reads as
 * the technologies at a glance; the outline icons follow their label. Both
 * the fill and the colour depart from the kit's icon rules on purpose (see
 * the kit's Icons section).
 */

/** A brand mark from Simple Icons as an icon component, in the brand's colour. */
const brandMark = (icon: SimpleIcon): SkillIcon => {
  const Mark: SkillIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill={`#${icon.hex}`} aria-hidden="true" className={className}>
      <path d={icon.path} />
    </svg>
  );
  Mark.displayName = `${icon.title}Mark`;
  return Mark;
};

export const skillIcons: Readonly<Record<number, SkillIcon>> = {
  1: brandMark(siPython),
  2: brandMark(siPostgresql),
  3: brandMark(siDocker),
  // System engineering: services talking to each other.
  4: Network,
  5: Sparkles,
  6: brandMark(siKubernetes),
  // CI/CD: the build-and-deploy loop.
  7: InfinityIcon,
  8: Cloud,
  9: brandMark(siReact),
  10: brandMark(siClaude),
};
