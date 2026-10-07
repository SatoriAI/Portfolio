import { forwardRef } from "react";

import { cn } from "@/lib/utils";

/** The bolt: one crisp, geometric path, 12 × 16. */
const BOLT = "M7 0 L1 9 H5.5 L4.5 16 L11 6.5 H6.5 Z";

type BoltProps = {
  className?: string;
};

/**
 * The lightning mark the home page uses for speed, in iris, with a blush echo
 * laid behind it, hidden at rest. The ref is the echo, so a caller can flash
 * it once, as the stack's jolt splits its text into iris and blush.
 * Decorative: the words beside it carry the meaning.
 */
const Bolt = forwardRef<SVGPathElement, BoltProps>(({ className }, echo) => (
  <svg
    aria-hidden="true"
    viewBox="-1 -1 15 18"
    className={cn("inline-block shrink-0 overflow-visible", className)}
  >
    <path
      ref={echo}
      d={BOLT}
      transform="translate(1.6 0.8)"
      className="fill-blush-deep opacity-0"
    />
    <path d={BOLT} strokeWidth="0.6" strokeLinejoin="miter" className="fill-iris stroke-iris" />
  </svg>
));
Bolt.displayName = "Bolt";

export default Bolt;
