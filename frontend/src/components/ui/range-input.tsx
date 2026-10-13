import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type RangeInputProps = Omit<ComponentProps<"input">, "type" | "className" | "aria-valuetext"> & {
  /**
   * What a screen reader says for the current value, e.g. "t = 0.50" or
   * "+3". Required: the bare number is rarely what the figure means.
   */
  valueText: string;
};

/**
 * The kit's scrubber: a native range input drawn as a hairline track with a
 * square ink thumb. Native, so arrows, Page Up/Down, Home and End, touch and
 * screen readers all work without code here. Give it an accessible name by
 * wrapping it in a <label> or passing aria-label.
 */
const RangeInput = ({ valueText, ...props }: RangeInputProps) => (
  <input
    type="range"
    aria-valuetext={valueText}
    className={cn(
      // 44 px tall for a finger, centred where the 32 px track sat: raised
      // 6 px and top-aligned, the extra 6 px below falls inside the line's
      // descent, so nothing around it moves (measured, not derived).
      "-mt-1.5 h-11 w-full min-w-0 cursor-pointer appearance-none bg-transparent align-top",
      "[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-control-border",
      "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-motif [&::-webkit-slider-thumb]:bg-primary",
      "[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-control-border",
      "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-motif [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
      // Keyboard focus rings the thumb, not the whole track, in the kit's
      // 2 px iris outline at 3 px. On the pseudo-element itself: the ring
      // utilities read variables a thumb never inherits.
      "focus-visible:outline-none",
      "[&:focus-visible::-webkit-slider-thumb]:outline [&:focus-visible::-webkit-slider-thumb]:outline-2 [&:focus-visible::-webkit-slider-thumb]:outline-offset-[3px] [&:focus-visible::-webkit-slider-thumb]:outline-iris",
      "[&:focus-visible::-moz-range-thumb]:outline [&:focus-visible::-moz-range-thumb]:outline-2 [&:focus-visible::-moz-range-thumb]:outline-offset-[3px] [&:focus-visible::-moz-range-thumb]:outline-iris",
    )}
    {...props}
  />
);

export { RangeInput };
