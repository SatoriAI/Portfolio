import { type ReactNode, type RefObject, useRef } from "react";
import { createPortal } from "react-dom";

import { useLatest } from "@/hooks/use-latest";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { clamp01, easeInOutCubic } from "@/lib/motion";
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
   * the ring it wears there (chosen, receded). The ring is the sidebar's, not the
   * timeline's: it fades in over the last stretch of the way down and out over
   * the first stretch of the way up, with the scroll, so a choice made beside
   * the skills never reaches the timeline and never blinks at the hand-over.
   */
  roles: readonly { id: number; mark: ReactNode; ring?: string }[];
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
/** The share of a circle's own way, at the sidebar's end, over which its ring fades. */
const RING_FADE = 0.5;

const CircleFlight = ({ roles, section, from, to, onPhase }: CircleFlightProps) => {
  const copies = useRef<(HTMLDivElement | null)[]>([]);
  const rings = useRef<(HTMLSpanElement | null)[]>([]);
  const phase = useRef<FlightPhase | null>(null);
  // Read through a ref, so a new callback each render does not restart the loop.
  const tell = useLatest(onPhase);

  // A ring's look changes as roles are chosen, through React; only how many
  // circles there are restarts the loop.
  useScrollFrame(
    () => {
      const sectionTop = section.current?.getBoundingClientRect().top;
      if (sectionTop === undefined) return;
      const start = window.innerHeight * START_AT;
      const end = window.innerHeight * END_AT;
      const progress = clamp01((start - sectionTop) / (start - end));
      const next: FlightPhase = progress <= 0 ? "timeline" : progress >= 1 ? "sidebar" : "flying";
      if (next !== phase.current) {
        phase.current = next;
        tell.current(next);
      }

      // Every circle is measured before any copy is moved, so the frame lays
      // the page out once rather than once per role.
      const ends = roles.map((role) => {
        if (next !== "flying") return null;
        const origin = from.current?.querySelector(`[data-timeline-circle="${role.id}"]`);
        const target = to.current?.querySelector(`[data-sidebar-circle="${role.id}"]`);
        return origin && target
          ? { a: origin.getBoundingClientRect(), b: target.getBoundingClientRect() }
          : null;
      });
      roles.forEach((_role, index) => {
        const copy = copies.current[index];
        if (!copy) return;
        if (next !== "flying") {
          copy.style.visibility = "hidden";
          return;
        }
        const measured = ends[index];
        if (!measured) return;
        const { a, b } = measured;
        const span = 1 - STAGGER * (roles.length - 1);
        const t = easeInOutCubic(clamp01((progress - STAGGER * index) / span));
        const size = a.width + (b.width - a.width) * t;
        copy.style.visibility = "visible";
        copy.style.width = `${size}px`;
        copy.style.height = `${size}px`;
        copy.style.transform = `translate(${a.left + (b.left - a.left) * t}px, ${
          a.top + (b.top - a.top) * t
        }px)`;
        const ring = rings.current[index];
        if (ring) ring.style.opacity = String(clamp01((t - (1 - RING_FADE)) / RING_FADE));
      });
    },
    { watch: roles.length },
  );

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
      {roles.map((role, index) => (
        <div
          key={role.id}
          ref={(element) => {
            copies.current[index] = element;
          }}
          className="invisible absolute left-0 top-0 rounded-full shadow-rim will-change-transform"
        >
          {role.mark}
          {/* The sidebar's look, laid over the plain copy; never pulsing, as
              the choosing has already played on the circle itself. */}
          <span
            ref={(element) => {
              rings.current[index] = element;
            }}
            className={cn(
              "absolute inset-0 rounded-full opacity-0",
              role.ring,
              "motion-safe:animate-none",
            )}
          />
        </div>
      ))}
    </div>,
    document.body,
  );
};

export default CircleFlight;
