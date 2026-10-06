import { type ReactNode, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

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

  useEffect(() => {
    const element = line.current;
    if (!element || prefersReducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setStarted(true);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!started || done) return;
    const step = Math.min(LETTER_MS, MAX_MS / text.length);
    const tick = window.setInterval(() => setTyped((count) => count + 1), step);
    return () => window.clearInterval(tick);
  }, [started, done, text.length]);

  const at = after ? text.lastIndexOf(" ") + 1 : text.length;
  const head = text.slice(0, at);
  const tail = (
    <span className="whitespace-nowrap">
      {text.slice(at)}
      {after}
    </span>
  );
  if (done) {
    return (
      <>
        {head}
        {tail}
      </>
    );
  }
  return (
    <span ref={line} className="relative">
      <span className="text-transparent">
        {head}
        {tail}
      </span>
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
