import { Fragment, useEffect, useRef } from "react";

import Bolt from "@/components/brand/Bolt";
import type { CheckState } from "@/components/home/LiveCheck";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** One wording per plural category of the count (see Intl.PluralRules). */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

export type CheckProofLabels = {
  /** `{n}` is replaced with the number of sites being checked. */
  checking: PluralForms;
  /** `{n}` is replaced with the number that answered, `{ms}` with their mean time. */
  answered: PluralForms;
  /** When none answered. */
  none: string;
};

/** The flash of the bolt when the last answer arrives. */
const FLASH_MS = 260;

type CheckProofProps = {
  /** The live checks of every site that is checked, one per address. */
  checks: readonly CheckState[];
  labels: CheckProofLabels;
  locale: string;
  /** Called once, the first time the sentence is wholly in view. */
  onSeen?: () => void;
  className?: string;
};

/**
 * The live checks as one sentence of proof under the section's lead: while
 * they run it says how many sites it is asking, and once all have answered,
 * how many did and in how long on average. The bolt flashes once, when the
 * last answer arrives. Two lines are kept on a phone, where the finished
 * sentence wraps, so it never moves what is below it.
 */
const CheckProof = ({ checks, labels, locale, onSeen, className }: CheckProofProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const echo = useRef<SVGPathElement>(null);
  // It says the sites are being checked, so it starts the checks when it is
  // read, not only when the projects below it come into view.
  const line = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const element = line.current;
    if (!element || !onSeen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        onSeen();
      },
      { threshold: 1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [onSeen]);
  const plural = new Intl.PluralRules(locale);
  const pick = (forms: PluralForms, n: number) => forms[plural.select(n)] ?? forms.other;

  const done = checks.length > 0 && checks.every((state) => state.phase === "done");
  const times = checks.flatMap((state) =>
    state.phase === "done" && state.result.answered ? [state.result.ms] : [],
  );
  const mean = Math.round(times.reduce((sum, ms) => sum + ms, 0) / Math.max(times.length, 1));

  useEffect(() => {
    const element = echo.current;
    if (!done || !element || prefersReducedMotion) return;
    const flash = element.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
      duration: FLASH_MS,
      easing: "ease-out",
    });
    return () => flash.cancel();
  }, [done, prefersReducedMotion]);

  if (checks.length === 0) return null;

  // The numbers in the sentence, set in mono iris.
  const figure = (text: string) => (
    <span className="font-mono font-semibold text-iris">{text}</span>
  );
  const sentence = (template: string, n: number) =>
    template
      .split(/(\{n\}|\{ms\})/)
      .map((part, at) => (
        <Fragment key={at}>
          {part === "{n}" ? figure(String(n)) : part === "{ms}" ? figure(`${mean} ms`) : part}
        </Fragment>
      ));

  return (
    <p
      ref={line}
      className={cn(
        "flex min-h-[3.25rem] items-start gap-2.5 text-base text-muted-foreground sm:min-h-7 sm:items-center",
        className,
      )}
    >
      <Bolt
        ref={echo}
        className={cn("mt-1 size-4 transition-opacity duration-200 sm:mt-0", !done && "opacity-35")}
      />
      <span>
        {!done
          ? sentence(pick(labels.checking, checks.length), checks.length)
          : times.length === 0
            ? labels.none
            : sentence(pick(labels.answered, times.length), times.length)}
      </span>
    </p>
  );
};

export default CheckProof;
