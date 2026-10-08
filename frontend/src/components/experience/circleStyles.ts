import { cn } from "@/lib/utils";

/**
 * The company circle as a control, shared by the timeline and the sidebar
 * beside the skills, so the two never drift; the copies that fly between them
 * wear the sidebar's state on a ring of their own (circleRing, CircleFlight).
 *
 * Two states, meaning two things. Chosen is the reader's own pick: the rim
 * itself turns iris and, in the sidebar beside the skills, wears an iris halo
 * (shadow-rim-chosen-halo) that swells three times as it is chosen and then
 * rests, the one loud mark in the column; on the timeline, where a name sits
 * just above and the role's dialog opens over it at once, the rim alone. A
 * chosen skill answers: the roles that used it gain a soft lavender ring
 * outside the rim, related rather than chosen, and the rest recede, grey and
 * faint, as the chart beside it fades the skills a chosen role did not use.
 * A chosen role keeps its halo either way, the one loud mark, and greys with
 * the rest if the skill passed it over. Keyboard focus sits outside the rim
 * (shadow-rim-focus, or an outline over the halo on the chosen one), so it
 * shows on any of them. The hover lift and ring wait for a real pointer: on
 * touch a tap would leave them stuck.
 */

export const circleControl = [
  "rounded-full shadow-rim",
  "motion-safe:transition-[transform,opacity,filter] motion-safe:duration-200 motion-safe:ease-brand",
  "[@media(hover:hover)]:motion-safe:hover:-translate-y-1",
  "focus-visible:shadow-rim-focus",
].join(" ");

/** A role a chosen skill did not use: grey and faint, still legible and pressable. */
const RECEDED = "opacity-45 grayscale";
/** A role a chosen skill used: a soft lavender ring outside the rim. */
const MATCHED = "outline outline-[3px] outline-offset-[5px] outline-lavender-deep";

export const circleState = (
  selected: boolean,
  {
    matched = false,
    receded = false,
    halo = true,
  }: { matched?: boolean; receded?: boolean; halo?: boolean } = {},
) =>
  cn(
    selected
      ? halo
        ? // Three swells as it is chosen, each 500 ms (set here: the control's
          // duration-200 sets animations too), then the halo rests. Nothing
          // ever switches the swell off, so nothing restarts it: keyboard
          // focus is an outline over the halo, which paints above any
          // box-shadow, and the halo stays under focus.
          [
            "shadow-rim-chosen-halo focus-visible:shadow-rim-chosen-halo",
            "motion-safe:animate-chosen-pulse motion-safe:[animation-duration:500ms]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-iris",
          ]
        : "shadow-rim-chosen focus-visible:shadow-rim-chosen-focus focus-visible:outline-none"
      : matched
        ? // Its ring stays under the pointer; focus shows outside it (shadow-rim-focus).
          MATCHED
        : // Without a ring of its own, the page's focus outline would land on
          // the rim and read as chosen.
          "focus-visible:outline-none [@media(hover:hover)]:hover:outline [@media(hover:hover)]:hover:outline-2 [@media(hover:hover)]:hover:outline-offset-[3px] [@media(hover:hover)]:hover:outline-iris/40",
    receded && RECEDED,
  );

/**
 * The sidebar's state for a copy in flight, laid over the plain copy: the
 * halo of a chosen role, the lavender ring of a matched one, and for a
 * receded one a wash of the page's own background that greys and fades the
 * mark beneath, as RECEDED does to the circle itself. Never pulsing: the
 * choosing has already played.
 */
export const circleRing = (selected: boolean, matched: boolean, receded: boolean) =>
  cn(
    selected ? "shadow-rim-chosen-halo" : matched && MATCHED,
    receded && "bg-background/55 backdrop-grayscale",
  );
