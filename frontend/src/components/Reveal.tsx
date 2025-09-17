import type { PropsWithChildren } from "react";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "fade";

type RevealProps = PropsWithChildren<{
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  /**
   * Where the content animates from
   */
  direction?: Direction;
  /**
   * Milliseconds to delay the reveal
   */
  delayMs?: number;
  /**
   * Extra distance offset for translate animations
   */
  offset?: number;
  /**
   * If true, reveal only once
   */
  once?: boolean;
}>;

export default function Reveal({
  as = "div",
  className,
  direction = "up",
  delayMs = 0,
  offset = 24,
  once = true,
  children,
}: RevealProps) {
  const Tag = as as any;
  const { ref, isRevealed, prefersReducedMotion } = useScrollReveal<HTMLDivElement>({
    once,
    root: null,
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.1,
  });

  const baseHidden = "opacity-0 will-change-[transform,opacity]";
  const baseVisible = "opacity-100";

  // Inline transform ensures JIT doesn't purge required classes
  const hiddenTransform: React.CSSProperties = (() => {
    if (prefersReducedMotion) return {};
    const distance = `${offset}px`;
    switch (direction) {
      case "up":
        return { transform: `translate3d(0, ${distance}, 0)` };
      case "down":
        return { transform: `translate3d(0, -${distance}, 0)` };
      case "left":
        return { transform: `translate3d(${distance}, 0, 0)` };
      case "right":
        return { transform: `translate3d(-${distance}, 0, 0)` };
      case "fade":
      default:
        return {};
    }
  })();

  // Use inline style for delay and transform; duration via Tailwind
  const style = prefersReducedMotion
    ? undefined
    : ({
        transitionDelay: `${isNaN(delayMs) ? 0 : delayMs}ms`,
        ...(isRevealed ? { transform: "translate3d(0,0,0)" } : hiddenTransform),
      } as React.CSSProperties);

  return (
    <Tag
      ref={ref}
      style={style}
      className={cn(
        "transform-gpu transition-all duration-700 ease-out",
        !prefersReducedMotion && !isRevealed && baseHidden,
        (prefersReducedMotion || isRevealed) && baseVisible,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
