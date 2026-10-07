import { useEffect, useRef, useState } from "react";

import type { CheckState } from "@/components/home/LiveCheck";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
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
 * Without a screenshot the window is a short band, the icon beside the
 * project's one line, so no tall empty field stands in for a picture.
 */

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
};

const answered = (state: CheckState) => state.phase === "done" && state.result.answered;

const ProjectWindow = ({
  screenshot,
  alt,
  icon,
  subtitle,
  checkState,
  always = false,
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
      <div className="flex items-center gap-5 bg-lavender px-6 py-8 md:px-8">
        {icon}
        {subtitle && (
          <p className="text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground md:text-h2-sm">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative grid aspect-video place-items-center bg-lavender">
      {icon}
      <img
        ref={image}
        src={screenshot}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-top",
          !painted && "[clip-path:inset(0_0_100%_0)]",
        )}
      />
    </div>
  );
};

export default ProjectWindow;
