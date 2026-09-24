import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Hover feedback for a card that is itself a target. The kit allows motion or
   * elevation to "imply interactivity only when the whole card is actionable",
   * so pass this from whether the card actually has a destination — never as a
   * constant. It also makes the card the positioning context for a stretched
   * link, which is how a whole card becomes one target.
   *
   * The 2px lift is a local decision, not a kit value: the kit fixes hover
   * feedback at 160-200ms but names no distance.
   */
  interactive?: boolean;
  /** Pastel surfaces are for highlighted sections, never for controls. */
  tone?: "surface" | "lavender" | "blush";
};

const toneClassName: Record<NonNullable<CardProps["tone"]>, string> = {
  surface: "border-border bg-card",
  lavender: "border-transparent bg-lavender",
  blush: "border-transparent bg-blush",
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, tone = "surface", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card border text-card-foreground",
        toneClassName[tone],
        interactive &&
          // motion-safe rather than a motion-reduce override: the override only
          // won by stylesheet order, and under reduced motion the transform rule
          // is now never generated. The shadow and border still respond, so the
          // card keeps a visible hover state without moving.
          "relative transition-[box-shadow,border-color,transform] duration-200 ease-brand hover:border-control-border hover:shadow-lift motion-safe:hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-card-title-sm font-semibold md:text-card-title", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-base text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
