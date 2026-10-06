import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * The roles' circles flying from the career timeline to the sidebar beside
 * the skills, in step with the scroll, and back again when the reader scrolls
 * up. Only the scroll moves them: nothing plays on its own and nothing takes
 * the scroll over.
 *
 * The real circles stay where they live. While the flight is under way, the
 * page hides the sidebar's and leaves the timeline's faint, and this draws a
 * copy of each, fixed to the screen,
 * placed every frame between its circle on the timeline and its slot in the
 * sidebar as both are right now, so the copy always lands exactly on its slot
 * whatever the window or the speed of the scroll. The page is told only when
 * the phase changes: on the timeline, flying, or in the sidebar.
 *
 * The flight runs while the skills section's top travels from just below the
 * screen to two thirds of the way down, so the circles are in place by the
 * time the first rows are read. Each circle leaves a moment after the one
 * above it.
 */

export type FlightPhase = "timeline" | "flying" | "sidebar";

type CircleFlightProps = {
  /**
   * The roles, in the order they sit in the sidebar, each with its mark and
   * the ring it wears there (chosen, lit), so it keeps it in flight.
   */
  roles: readonly { id: number; mark: ReactNode; className?: string }[];
  /** The skills section: its top's travel sets the flight's progress. */
  section: RefObject<HTMLElement>;
  /** Where the circles start: the timeline. */
  from: RefObject<HTMLElement>;
  /** Where they land: the sidebar. */
  to: RefObject<HTMLElement>;
  onPhase: (phase: FlightPhase) => void;
};

/** The flight starts when the section's top is this far down the screen… */
const START_AT = 1.05;
/** …and ends when it is this far down. */
const END_AT = 0.65;
/** How much later each circle leaves than the one before, as progress. */
const STAGGER = 0.08;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const CircleFlight = ({ roles, section, from, to, onPhase }: CircleFlightProps) => {
  const copies = useRef<(HTMLDivElement | null)[]>([]);
  const phase = useRef<FlightPhase | null>(null);
  // Read through a ref, so a new callback each render does not restart the loop.
  const tell = useRef(onPhase);
  tell.current = onPhase;

  useEffect(() => {
    let frame = 0;

    const place = () => {
      frame = 0;
      const sectionTop = section.current?.getBoundingClientRect().top;
      if (sectionTop === undefined) return;
      const start = window.innerHeight * START_AT;
      const end = window.innerHeight * END_AT;
      const progress = clamp((start - sectionTop) / (start - end));
      const next: FlightPhase = progress <= 0 ? "timeline" : progress >= 1 ? "sidebar" : "flying";
      if (next !== phase.current) {
        phase.current = next;
        tell.current(next);
      }

      roles.forEach((role, index) => {
        const copy = copies.current[index];
        if (!copy) return;
        if (next !== "flying") {
          copy.style.visibility = "hidden";
          return;
        }
        const origin = from.current?.querySelector(`[data-timeline-circle="${role.id}"]`);
        const target = to.current?.querySelector(`[data-sidebar-circle="${role.id}"]`);
        if (!origin || !target) return;
        const a = origin.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const span = 1 - STAGGER * (roles.length - 1);
        const t = easeInOut(clamp((progress - STAGGER * index) / span));
        const size = a.width + (b.width - a.width) * t;
        copy.style.visibility = "visible";
        copy.style.width = `${size}px`;
        copy.style.height = `${size}px`;
        copy.style.transform = `translate(${a.left + (b.left - a.left) * t}px, ${
          a.top + (b.top - a.top) * t
        }px)`;
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [roles, section, from, to]);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
      {roles.map((role, index) => (
        <div
          key={role.id}
          ref={(element) => {
            copies.current[index] = element;
          }}
          className={cn(
            "invisible absolute left-0 top-0 rounded-full shadow-rim will-change-transform",
            role.className,
          )}
        >
          {role.mark}
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default CircleFlight;
