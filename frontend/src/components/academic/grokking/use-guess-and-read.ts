import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useState,
} from "react";

import { STEP_MAX } from "@/components/academic/grokking/geometry";
import { GROKKING_STEPS, nearestStep } from "@/lib/grokking";

/**
 * The chart asks before it answers. At first it shows only the examples seen
 * in training, already at 100% by step 1000, and asks the reader from which
 * step the model will handle new ones: the reader sets a marker, on the plot
 * or with the slider in the chart's first row, and presses Check; there is
 * no marker, and nothing to check, until the reader has chosen. Then the
 * new examples are drawn in, left to right at an even pace over the steps,
 * so the delay, which is the finding, passes as time. With reduced motion
 * they appear at once. The crosshair then stands at the guess, focus stays
 * in the chart, and the reader can guess again. From then on the plot reads
 * out any step: pointed at, tapped, or stepped through with the arrow keys,
 * with Escape putting the tooltip away.
 *
 * This hook holds that sequence and the plot's pointer and keyboard
 * handling; the chart draws it, and the plot draws the new examples in,
 * calling `drawn` when they are.
 */

/** The guess moves in half-thousands: finer than the measurements, no finer. */
const GUESS_STEP = 500;
/** The step read out first, the gap the section is about. */
const OPENING_STEP = 1000;

export type GuessPhase = "guess" | "drawing" | "drawn";

export function useGuessAndRead({
  plotRef,
  stepAt,
}: {
  /** The plot, focused by Check and Retry so the answer is heard in the chart. */
  plotRef: RefObject<HTMLElement>;
  /** The step under a pointer's x in the plot. */
  stepAt: (x: number) => number;
}) {
  const [step, setStep] = useState(OPENING_STEP);
  const [showTip, setShowTip] = useState(false);
  // The reader's guess, then the new examples drawing in, then all drawn.
  const [phase, setPhase] = useState<GuessPhase>("guess");
  // The guess starts at step 0, where the marker waits to be moved; nothing
  // can be checked until the reader has moved it.
  const [guess, setGuess] = useState(0);
  const [picked, setPicked] = useState(false);
  // Whether the reader has moved the read-out since the answer: until then it
  // stays quiet, so the grade is heard first.
  const [moved, setMoved] = useState(false);
  const guessing = phase === "guess";

  const drawn = () => setPhase("drawn");

  const toGuess = (value: number) =>
    Math.min(STEP_MAX, Math.max(0, Math.round(value / GUESS_STEP) * GUESS_STEP));

  // Check keeps focus in the chart, which it is about to answer, and stands
  // the crosshair at the guess.
  const check = () => {
    if (!picked) return;
    plotRef.current?.focus();
    setStep(nearestStep(GROKKING_STEPS, guess));
    setPhase("drawing");
  };
  const retry = () => {
    plotRef.current?.focus();
    setGuess(0);
    setPicked(false);
    setMoved(false);
    setShowTip(false);
    setStep(OPENING_STEP);
    setPhase("guess");
  };

  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const at = stepAt(event.clientX - bounds.left);
    if (guessing) {
      // A press or a drag moves the marker; a mouse only hovering leaves it.
      // The press captures the pointer, so the drag goes on off the plot.
      if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
      if (event.type === "pointerdown" || event.buttons === 1) {
        setGuess(toGuess(at));
        setPicked(true);
      }
      return;
    }
    setMoved(true);
    setStep(nearestStep(GROKKING_STEPS, at));
    setShowTip(true);
  };
  // A mouse that leaves takes the tooltip with it. A lifted finger leaves the
  // plot too, but a tap's tooltip should stay to be read, until focus moves on.
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") setShowTip(false);
  };
  // Focus from the keyboard shows the tooltip; focus from a click does not,
  // or it would outstay the pointer.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!guessing && event.currentTarget.matches(":focus-visible")) setShowTip(true);
  };
  const onBlur = () => setShowTip(false);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setShowTip(false);
      return;
    }
    if (guessing) {
      if (event.key === "Enter") {
        event.preventDefault();
        check();
        return;
      }
      const notch =
        event.key === "ArrowRight" ? GUESS_STEP : event.key === "ArrowLeft" ? -GUESS_STEP : 0;
      if (event.key !== "Home" && event.key !== "End" && notch === 0) return;
      event.preventDefault();
      // From the latest guess, however fast the keys come.
      setGuess((now) =>
        event.key === "Home" ? 0 : event.key === "End" ? STEP_MAX : toGuess(now + notch),
      );
      setPicked(true);
      return;
    }
    setMoved(true);
    const index = GROKKING_STEPS.indexOf(step);
    const last = GROKKING_STEPS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? Math.min(last, index + 1)
        : event.key === "ArrowLeft"
          ? Math.max(0, index - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setStep(GROKKING_STEPS[next]);
    setShowTip(true);
  };

  return {
    phase,
    step,
    guess,
    picked,
    moved,
    showTip,
    check,
    retry,
    drawn,
    plotHandlers: {
      onPointerMove: onPointer,
      onPointerDown: onPointer,
      onPointerLeave,
      onFocus,
      onBlur,
      onKeyDown,
    },
  };
}
