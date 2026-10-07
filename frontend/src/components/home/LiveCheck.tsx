import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

import Bolt from "@/components/brand/Bolt";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { type CheckResult, hostOf } from "@/lib/liveCheck";
import { EASE_BRAND } from "@/lib/motion";
import { fillTemplate } from "@/lib/text";
import { cn } from "@/lib/utils";

/**
 * The home page's signature: a project's address bar that checks the address
 * live, from the reader's browser, when the reader presses it.
 *
 * The bar reads like a browser's: the address, which opens the site, then a
 * hairline to the status. Pressing the line or the status sends a strike of
 * lightning along the hairline from the address to the bar's end, where it
 * holds for as long as the request is out, the bar pressed in; when the
 * answer comes back the strike fades and the measured time lands at the end
 * beside a bolt. With no answer the strike stays, grey, and the bar says so.
 * Nothing moves until the reader presses, or the section first checks every
 * address; under reduced motion nothing moves at all and only the words
 * change.
 */

export type CheckState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "done"; result: CheckResult };

export type LiveCheckLabels = {
  /** The bar's word before any check, and its accessible name's start. */
  check: string;
  again: string;
  checking: string;
  /** `{ms}` is replaced. */
  answered: string;
  silent: string;
  /** The address's accessible name, as a link that opens the site; `{host}` is replaced. */
  openAria: string;
};

/** The strike's run along the hairline. */
const STRIKE_MS = 360;

/** The strike's path across a 100-wide box: twelve zigs, level at both ends. */
const ZIGZAG = `M0 0 ${Array.from({ length: 11 }, (_, at) => `L${(at + 1) * (100 / 12)} ${at % 2 ? 4 : -4}`).join(" ")} L100 0`;

/** The strike stretched along the hairline, its stroke kept at its own width. */
const Zigzag = ({ className, width }: { className: string; width: number }) => (
  <svg
    viewBox="0 -6 100 12"
    preserveAspectRatio="none"
    className={cn("absolute inset-0 h-full w-full overflow-visible", className)}
  >
    <path
      d={ZIGZAG}
      fill="none"
      strokeWidth={width}
      strokeLinejoin="miter"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

type LiveCheckProps = {
  url: string;
  state: CheckState;
  onCheck: () => void;
  labels: LiveCheckLabels;
  className?: string;
};

const LiveCheck = ({ url, state, onCheck, labels, className }: LiveCheckProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const strike = useRef<HTMLSpanElement>(null);
  // The result shows once the dot is home, not while it is still travelling.
  const [shown, setShown] = useState<CheckResult | null>(
    state.phase === "done" ? state.result : null,
  );

  // The strike in flight, kept across renders so the time can wait for it:
  // an answer faster than the strike still lands only once it has struck.
  const flight = useRef<Animation | null>(null);
  useEffect(() => () => flight.current?.cancel(), []);

  useEffect(() => {
    const bolt = strike.current;
    if (state.phase === "idle") return;
    if (!bolt || prefersReducedMotion) {
      setShown(state.phase === "done" ? state.result : null);
      return;
    }
    if (state.phase === "checking") {
      setShown(null);
      flight.current?.cancel();
      flight.current = bolt.animate(
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
        { duration: STRIKE_MS, easing: EASE_BRAND, fill: "forwards" },
      );
      return;
    }
    const result = state.result;
    // A frame opened after its check finished shows the result as it stands.
    if (!flight.current) {
      setShown(result);
      return;
    }
    let live = true;
    flight.current.finished.catch(() => undefined).then(() => live && setShown(result));
    return () => {
      live = false;
    };
  }, [state, prefersReducedMotion]);

  const busy = state.phase !== "idle" && !shown;
  const silent = Boolean(shown && !shown.answered);
  // Still "checking" until the strike has struck and the answer is in.
  const status = busy
    ? labels.checking
    : shown?.answered
      ? fillTemplate(labels.answered, { ms: shown.ms })
      : silent
        ? labels.silent
        : labels.check;
  const host = hostOf(url);

  // One bar, two controls, each what it looks like: the address opens the
  // site, as a browser's would, and the line with the status at its end
  // asks the site again. The bar is pressed in while a request is out.
  return (
    <>
      <div
        className={cn(
          "flex min-h-11 min-w-0 flex-1 items-center rounded-lg border border-control-border bg-card transition-[box-shadow,background-color] duration-200",
          busy && "bg-background shadow-press",
          className,
        )}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={fillTemplate(labels.openAria, { host })}
          title={host}
          // A long host gives way first, cut with an ellipsis, so the time
          // at the bar's end always keeps its room.
          className="flex min-h-11 min-w-0 shrink items-center gap-1.5 rounded-l-lg pl-4 pr-2 font-mono text-meta text-foreground underline-offset-4 outline-none transition-colors duration-200 hover:text-iris hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="truncate">{host}</span>
          <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
        </a>
        <button
          type="button"
          onClick={onCheck}
          disabled={state.phase === "checking"}
          aria-label={`${state.phase === "done" ? labels.again : labels.check}: ${host}`}
          className="flex min-h-11 flex-1 items-center gap-3 rounded-r-lg pl-1 pr-4 text-left outline-none transition-colors duration-200 hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-progress"
        >
          <span aria-hidden="true" className="relative flex h-3 min-w-6 flex-1 items-center">
            <span className="h-px w-full bg-border" />
            {/* The strike: a zigzag run from the address to the bar's end,
                in iris over a blush echo, drawn by uncovering it. It holds
                while the request is out and fades once the time lands; with
                no answer it stays, grey. */}
            <span
              ref={strike}
              className={cn(
                "absolute inset-0 transition-opacity duration-200",
                busy || silent ? "opacity-100" : "opacity-0",
              )}
              style={busy ? { clipPath: "inset(0 100% 0 0)" } : undefined}
            >
              <Zigzag className="translate-x-px translate-y-[1.5px] stroke-blush-deep" width={2} />
              <Zigzag className={silent ? "stroke-muted-foreground" : "stroke-iris"} width={1.5} />
            </span>
          </span>
          <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5 font-mono">
            {shown?.answered ? (
              <>
                <Bolt className="size-4" />
                <span className="text-base font-semibold text-foreground">{shown.ms}</span>
                <span className="text-meta text-muted-foreground">ms</span>
              </>
            ) : silent ? (
              <span className="text-meta text-muted-foreground">{labels.silent}</span>
            ) : busy ? (
              // The strike says it is checking; the words only where it does
              // not move.
              prefersReducedMotion && <span className="text-meta text-iris">{labels.checking}</span>
            ) : (
              <span className="text-meta text-iris">
                <span className="sm:hidden">↻</span>
                <span className="hidden sm:inline">{labels.check} ↻</span>
              </span>
            )}
          </span>
        </button>
      </div>
      {/* Read out once the result is in, not the bar's every word. */}
      <p aria-live="polite" className="sr-only">
        {busy ? labels.checking : shown ? status : ""}
      </p>
    </>
  );
};

export default LiveCheck;
