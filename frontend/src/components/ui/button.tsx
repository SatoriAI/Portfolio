import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Kit: primary = navy on white, 12px radius, at least 44px tall, hover #293A5C;
// secondary = white with navy text and a control-border outline, pastel on hover.
//
// The press state is a local decision — the kit is silent on `active:` — but it
// follows from its rule that "a pale border must never be the only indication
// that a control is interactive". Behind motion-safe, so it is simply not
// generated under prefers-reduced-motion. 200ms is the top of the kit's
// 160-200ms hover window.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-[color,background-color,border-color,transform] duration-200 ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-safe:active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border border-control-border bg-card text-foreground hover:border-foreground hover:bg-lavender",
        // The kit's "secondary" button is the outlined one; pastels are
        // backgrounds, never button fills.
        secondary:
          "border border-control-border bg-card text-foreground hover:border-foreground hover:bg-lavender",
        ghost: "text-foreground hover:bg-lavender",
        link: "h-auto min-h-0 rounded-none px-0 text-iris underline underline-offset-4 hover:text-primary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-10 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
