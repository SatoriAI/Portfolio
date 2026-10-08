/**
 * The company circle as a control, shared by the timeline, the sidebar beside
 * the skills and the copies that fly between them, so the three never drift.
 *
 * Chosen turns the rim itself iris, with a soft iris halo round it
 * (shadow-rim-chosen), so the choice reads at a glance among the logos; lit
 * up from elsewhere (a chosen skill's roles) is a dashed iris ring over the
 * grey rim, so the two read apart when both show at once. Keyboard focus sits
 * outside the rim (shadow-rim-focus, or shadow-rim-chosen-focus on the chosen
 * one), so it shows beside either.
 * The hover lift and ring wait for a real pointer: on touch a tap would
 * leave them stuck.
 */

export const circleControl = [
  "rounded-full shadow-rim",
  "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-brand",
  "[@media(hover:hover)]:motion-safe:hover:-translate-y-1",
  "focus-visible:shadow-rim-focus",
].join(" ");

export const circleState = (selected: boolean, lit: boolean) =>
  selected
    ? "shadow-rim-chosen focus-visible:shadow-rim-chosen-focus focus-visible:outline-none"
    : lit
      ? "outline-dashed outline-2 outline-offset-[3px] outline-iris"
      : // Without a ring of its own, the page's focus outline would land on
        // the rim and read as chosen.
        "focus-visible:outline-none [@media(hover:hover)]:hover:outline [@media(hover:hover)]:hover:outline-2 [@media(hover:hover)]:hover:outline-offset-[3px] [@media(hover:hover)]:hover:outline-iris/40";
