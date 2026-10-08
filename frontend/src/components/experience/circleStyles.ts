import { cn } from "@/lib/utils";

/**
 * The company circle as a control, shared by the timeline and the sidebar
 * beside the skills, so the two never drift; the copies that fly between them
 * wear the sidebar's state on a ring of their own (circleRing, CircleFlight).
 *
 * Beside the skills, every choice answers the same way: a role chosen, or a
 * role a chosen skill used, gains a soft lavender ring outside the rim, and
 * the others recede, grey and faint, as the chart fades the skills a chosen
 * role did not use; a receded circle comes back in full under keyboard focus,
 * so its focus ring keeps its contrast. On the timeline, where a name sits just above and the
 * role's dialog opens over it at once, a chosen circle's rim turns iris.
 * Keyboard focus sits outside the rim (shadow-rim-focus), outside the ring
 * too. The hover lift and ring wait for a real pointer: on touch a tap would
 * leave them stuck.
 */

export const circleControl = [
  "rounded-full shadow-rim",
  "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-brand",
  "[@media(hover:hover)]:motion-safe:hover:-translate-y-1",
  "focus-visible:shadow-rim-focus",
].join(" ");

/** A circle with no ring of its own: a faint ring under the pointer, and the
 * page's focus outline kept off the rim, where it would read as chosen. */
const PLAIN =
  "focus-visible:outline-none [@media(hover:hover)]:hover:outline [@media(hover:hover)]:hover:outline-2 [@media(hover:hover)]:hover:outline-offset-[3px] [@media(hover:hover)]:hover:outline-iris/40";
/** Chosen, or used by the chosen skill: a soft lavender ring outside the rim. */
const MARKED = "outline outline-[3px] outline-offset-[5px] outline-lavender-deep";
/**
 * Neither, while something is chosen: grey and faint, still legible and
 * pressable. A filter rather than opacity, so it can fade on its own while the
 * sidebar keeps opacity for hiding its circles in flight, which must be
 * instant (SIDEBAR_TRANSITION). Back in full under keyboard focus.
 */
const RECEDED = "[filter:grayscale(1)_opacity(0.45)] focus-visible:[filter:none]";

/**
 * The sidebar's own transition: the lift and the receding fade over 200 ms;
 * opacity, which hides a circle while its copy flies, changes at once, so the
 * copy hands over cleanly.
 */
export const SIDEBAR_TRANSITION = "motion-safe:transition-[transform,filter]";

/** A circle on the timeline: its rim turns iris while its role is open. */
export const circleState = (selected: boolean) =>
  selected
    ? "shadow-rim-chosen focus-visible:shadow-rim-chosen-focus focus-visible:outline-none"
    : PLAIN;

type SidebarMarks = { marked: boolean; receded: boolean };

/**
 * Where a role stands beside the skills: marked when it is the chosen role or
 * one the chosen skill used, receded when something is chosen and it is
 * neither. Shared by the sidebar and the copies in flight, so they agree.
 */
export const sidebarMarks = (
  id: number,
  chosenRole: number | null,
  skillRoles: ReadonlySet<number> | null,
): SidebarMarks => {
  const marked = id === chosenRole || (skillRoles?.has(id) ?? false);
  return { marked, receded: (chosenRole !== null || skillRoles !== null) && !marked };
};

/** A circle in the sidebar beside the skills. */
export const sidebarCircleState = ({ marked, receded }: SidebarMarks) =>
  cn(marked ? MARKED : PLAIN, receded && RECEDED);

/** The lavender ring of a marked role, for its copy in flight. */
export const circleRing = ({ marked }: SidebarMarks) => (marked ? MARKED : "");

/**
 * A receded role's look on its copy in flight, `k` of the way there (0 plain,
 * 1 as in the sidebar): the same filter as RECEDED, so the two match exactly
 * at the hand-over.
 */
export const recededFilter = (k: number) =>
  k > 0 ? `grayscale(${k}) opacity(${1 - 0.55 * k})` : "";
