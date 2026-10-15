import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

/** The kit's entrance: the new theme spreads out from the button. */
const SPREAD_MS = 400;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** The transition in flight. A quick second flip skips the first, whose end
 *  must then leave the second's `theme-switch` class alone. */
let current: ReturnType<Document["startViewTransition"]> | null = null;

type ThemeToggleProps = {
  /** The action in words beside the icon, where there is room (the menu sheet). */
  labelled?: boolean;
  className?: string;
};

/**
 * One button that flips the theme. The page follows the machine until the
 * reader flips it, and flipping back returns it to the machine, so every
 * click changes the page. The icon is where the click goes: a moon in light,
 * a sun in dark.
 */
const ThemeToggle = ({ labelled = false, className }: ThemeToggleProps) => {
  const { language, theme, flipTheme } = useSettings();
  const t = translations[language].common;
  const Icon = theme === "light" ? Moon : Sun;
  const action = theme === "light" ? t.switchToDark : t.switchToLight;

  // The switch is the reader's own heat source: the new theme is revealed as
  // a circle growing from the button, once. Without view transitions, or
  // under reduced motion, it changes at once.
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      flipTheme();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const root = document.documentElement;
    root.classList.add("theme-switch");
    const transition = document.startViewTransition(() => {
      flushSync(flipTheme);
    });
    current = transition;
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: SPREAD_MS, easing: EASE, pseudoElement: "::view-transition-new(root)" },
        );
      })
      // A skipped transition (a second flip, a hidden tab) rejects `ready`;
      // the theme has still changed, so there is nothing to recover.
      .catch(() => {});
    transition.finished
      .catch(() => {})
      .finally(() => {
        if (current !== transition) return;
        current = null;
        root.classList.remove("theme-switch");
      });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={labelled ? undefined : action}
      title={labelled ? undefined : action}
      className={cn(
        // The language toggle's size and edge, so the two read as a pair, and
        // a finger's 44 px round it. Hover only where there is one: after a
        // tap, a phone keeps the hover and the button would look pressed.
        "tap-target relative inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-control-border bg-card text-foreground transition-colors duration-200 [@media(hover:hover)]:hover:bg-lavender-hover",
        labelled ? "px-3 text-sm font-medium" : "w-10",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {labelled && action}
    </button>
  );
};

export default ThemeToggle;
