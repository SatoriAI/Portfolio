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
      "h-8 w-full min-w-0 cursor-pointer appearance-none bg-transparent",
      "[&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-control-border",
      "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-motif [&::-webkit-slider-thumb]:bg-primary",
      "[&::-moz-range-track]:h-px [&::-moz-range-track]:bg-control-border",
      "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-motif [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
      "focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring focus-visible:[&::-webkit-slider-thumb]:ring-offset-2",
      "focus-visible:[&::-moz-range-thumb]:ring-2 focus-visible:[&::-moz-range-thumb]:ring-ring focus-visible:[&::-moz-range-thumb]:ring-offset-2",
    )}
    {...props}
  />
);

export { RangeInput };
