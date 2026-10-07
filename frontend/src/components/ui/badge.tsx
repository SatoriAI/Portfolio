import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Kit: labels are pastel backgrounds with navy text, set in Plex Mono, and
// must not look like buttons — so no hover state and no focus ring.
const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 font-mono text-xs font-normal leading-tight",
  {
    variants: {
      variant: {
        lavender: "bg-lavender text-foreground",
        blush: "bg-blush text-foreground",
        ink: "bg-primary text-primary-foreground",
        outline: "border border-border bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "lavender",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
