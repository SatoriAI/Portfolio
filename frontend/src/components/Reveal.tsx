import type { CSSProperties, ElementType, PropsWithChildren } from "react";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

type RevealProps = PropsWithChildren<{
  as?: ElementType;
  className?: string;
  /** Milliseconds to wait before revealing; use for a 50–70ms card stagger. */
  delayMs?: number;
  /** Distance travelled while fading in. The kit specifies 8px. */
  offset?: number;
  /** If true, reveal only once */
  once?: boolean;
}>;

/**
 * Section entrance from the kit: opacity 0 → 1 and translateY 8px → 0 over
 * 400ms on cubic-bezier(.22,1,.36,1), once, and skipped entirely under
 * prefers-reduced-motion. Content that is already on screen when it mounts
 * renders visible straight away, so nothing above the fold ever fades in.
 */
export default function Reveal({
  as: Tag = "div",
  className,
  delayMs = 0,
  offset = 8,
  once = true,
  children,
}: RevealProps) {
  const { ref, isRevealed, isInitiallyVisible, prefersReducedMotion } =
    useScrollReveal<HTMLElement>({ once });

  const skipAnimation = prefersReducedMotion || isInitiallyVisible;
  const visible = skipAnimation || isRevealed;

  // Inline transform ensures JIT doesn't purge required classes
  const style: CSSProperties | undefined = skipAnimation
    ? undefined
    : {
        transitionDelay: `${Number.isNaN(delayMs) ? 0 : delayMs}ms`,
        transform: visible ? "translate3d(0,0,0)" : `translate3d(0, ${offset}px, 0)`,
      };

  return (
    <Tag
      ref={ref}
      style={style}
      className={cn(
        !skipAnimation && "transition-[opacity,transform] duration-400 ease-brand",
        visible ? "opacity-100" : "opacity-0 will-change-[transform,opacity]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
