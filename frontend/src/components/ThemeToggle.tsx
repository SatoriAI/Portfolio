import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Monitor, Moon, Sun } from "lucide-react";

import { type ThemePreference, useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

const MODES = [
  { mode: "system", Icon: Monitor, key: "themeSystem" },
  { mode: "light", Icon: Sun, key: "themeLight" },
  { mode: "dark", Icon: Moon, key: "themeDark" },
] as const;

/** The kit's entrance: the new theme spreads out from the pressed segment. */
const SPREAD_MS = 400;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type ThemeToggleProps = {
  /** Words beside the icons, where there is room for them (the menu sheet). */
  labelled?: boolean;
  className?: string;
};

/**
 * Segmented System / Light / Dark control, the language toggle's sibling; the
 * pressed segment is the reader's choice, System included, so it always shows
 * whether the page is following the machine.
 */
const ThemeToggle = ({ labelled = false, className }: ThemeToggleProps) => {
  const { language, themePreference, setThemePreference, theme } = useSettings();
  const t = translations[language].common;
  const themeName = { light: t.themeLight, dark: t.themeDark };

  // The switch is the reader's own heat source: the new theme is revealed as
  // a circle growing from the segment, once. Without view transitions, or
  // under reduced motion, it changes at once.
  const choose = (mode: ThemePreference) => (event: MouseEvent<HTMLButtonElement>) => {
    if (mode === themePreference) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      setThemePreference(mode);
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
      flushSync(() => setThemePreference(mode));
    });
    transition.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: SPREAD_MS, easing: EASE, pseudoElement: "::view-transition-new(root)" },
      );
    });
    transition.finished.finally(() => root.classList.remove("theme-switch"));
  };

  return (
    <div
      role="group"
      aria-label={t.appearance}
      className={cn(
        "rounded-xl border border-control-border bg-card p-1",
        // With words the segments share the sheet's width, the word under its
        // icon: side by side, the Polish words outgrow a phone's sheet.
        labelled ? "flex w-full text-meta font-medium" : "inline-flex h-10 items-center",
        className,
      )}
    >
      {MODES.map(({ mode, Icon, key }) => {
        const active = mode === themePreference;
        const name =
          mode === "system"
            ? t.themeSystemNow.replace("{theme}", themeName[theme].toLowerCase())
            : t[key];
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            aria-label={labelled ? undefined : name}
            title={labelled ? undefined : name}
            onClick={choose(mode)}
            className={cn(
              "relative rounded-lg transition-colors duration-200",
              labelled
                ? "flex flex-1 flex-col items-center gap-1 px-1 py-2"
                : // The language toggle's segment: a finger's 44 px reaches
                  // past the pill above and below, and outward at the ends.
                  "inline-flex h-full items-center px-2.5 after:absolute after:-inset-y-[7px] after:left-0 after:right-0 first:after:-left-2.5 last:after:-right-2.5",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-lavender hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {labelled && t[key]}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
