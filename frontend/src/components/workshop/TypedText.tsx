import { type ReactNode, useEffect, useRef, useState } from "react";

import KeepWithLastWord from "@/components/workshop/KeepWithLastWord";
import { useOnceInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { splitLastWord } from "@/lib/text";

/** One letter's time, shortened for a long title so no title types for longer than the cap. */
const LETTER_MS = 40;
const MAX_MS = 1200;

/**
 * A line that types itself out, letter by letter, the first time it is well
 * in view, with an iris cursor that goes when it is done. It plays once and
 * never loops. The whole text is laid out from the start, transparent, so the
 * line takes its final shape at once and nothing below it moves as it types;
 * it is also what assistive technology reads. Under reduced motion the text
 * is simply there.
 *
 * Whatever comes after the line (an arrow) is kept with its last word, so it
 * never wraps onto a line of its own, while typing or after.
 */
const TypedText = ({ text, after }: { text: string; after?: ReactNode }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const line = useRef<HTMLSpanElement>(null);
  const [typed, setTyped] = useState(0);
  const [started, setStarted] = useState(false);
  const done = prefersReducedMotion || typed >= text.length;

  useOnceInView(line, () => setStarted(true), {
    threshold: 0.6,
    enabled: !prefersReducedMotion,
  });

  useEffect(() => {
    if (!started || done) return;
    const step = Math.min(LETTER_MS, MAX_MS / text.length);
    const tick = window.setInterval(() => setTyped((count) => count + 1), step);
    return () => window.clearInterval(tick);
  }, [started, done, text.length]);

  const whole = <KeepWithLastWord text={text}>{after}</KeepWithLastWord>;
  if (done) return whole;
  const at = splitLastWord(text)[0].length;
  return (
    <span ref={line} className="relative">
      <span className="text-transparent">{whole}</span>
      <span aria-hidden="true" className="absolute inset-0">
        {text.slice(0, Math.min(typed, at))}
        <span className="whitespace-nowrap">
          {typed > at ? text.slice(at, typed) : ""}
          <span className="ml-0.5 inline-block h-[0.9em] w-0.5 translate-y-[0.1em] bg-iris" />
        </span>
      </span>
    </span>
  );
};

export default TypedText;
