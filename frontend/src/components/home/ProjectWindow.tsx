import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import type { CheckState } from "@/lib/liveCheck";
import { EASE_BRAND } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The browser frame's window. With a screenshot, the page paints in when the
 * live check of its address comes back: the capture is revealed from the top
 * down, as a page loads, tied to a real answer. Until then, or if no answer
 * comes, the window shows the app icon on lavender. A frame opened after its
 * answer arrived shows the page at once; under reduced motion it appears
 * without the wipe.
 *
 * A phone app's window holds a phone instead, its screen painting in the
 * same way.
 *
 * Without a screenshot the window is a short band, the icon beside the
 * project's one line, so no tall empty field stands in for a picture.
 */

/**
 * 16:9 on its own; side by side with the story (lg up) the window grows to
 * the frame's foot instead, showing more of the page, cropped at the sides
 * rather than leaving a gap under a short frame (see ProjectFrame).
 */
const FILL = "aspect-video lg:aspect-auto lg:min-h-0 lg:flex-1";

/** How long the page takes to paint in, top to bottom. */
const PAINT_MS = 480;

type ProjectWindowProps = {
  screenshot?: string;
  alt: string;
  icon: React.ReactNode;
  subtitle?: string;
  checkState: CheckState;
  /** This site, which has nothing to check: its page is shown as it is. */
  always?: boolean;
  /** A phone app: its screen in a phone standing in the window. */
  phone?: boolean;
};

const answered = (state: CheckState) => state.phase === "done" && state.result.answered;

const ProjectWindow = ({
  screenshot,
  alt,
  icon,
  subtitle,
  checkState,
  always = false,
  phone = false,
}: ProjectWindowProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const image = useRef<HTMLImageElement>(null);
  const [painted, setPainted] = useState(always || answered(checkState));
  const lastPhase = useRef(checkState.phase);

  useEffect(() => {
    const was = lastPhase.current;
    lastPhase.current = checkState.phase;
    if (checkState.phase === "checking") return;
    if (!answered(checkState)) return;
    setPainted(true);
    // Only an answer that arrives while the frame is open paints in.
    if (was !== "checking" || prefersReducedMotion || !image.current) return;
    const paint = image.current.animate(
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
      { duration: PAINT_MS, easing: EASE_BRAND },
    );
    return () => paint.cancel();
  }, [checkState, prefersReducedMotion]);

  if (!screenshot) {
    return (
      <div className="flex items-center gap-5 bg-lavender px-6 py-8 md:px-8 lg:flex-1">
        {icon}
        {subtitle && (
          <p className="text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground md:text-h2-sm">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  const shot = (
    <img
      ref={image}
      src={screenshot}
      alt={alt}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-top",
        !painted && "[clip-path:inset(0_0_100%_0)]",
      )}
    />
  );

  if (phone) {
    // A phone app in the same 16:9 window as every project, so its panel is
    // no taller than theirs: the phone stands on the lavender, a white body
    // round its screen, cut off at the window's foot like a product shot.
    // The icon waits on its screen until the page paints in.
    return (
      <div className={cn("relative overflow-hidden bg-lavender", FILL)}>
        <div className="absolute left-1/2 top-[6%] w-[41%] -translate-x-1/2 rounded-[2rem] border border-border bg-card p-2">
          <div className="relative grid aspect-[390/844] place-items-center overflow-hidden rounded-3xl bg-lavender">
            {icon}
            {shot}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative grid place-items-center bg-lavender", FILL)}>
      {icon}
      {shot}
    </div>
  );
};

export default ProjectWindow;
