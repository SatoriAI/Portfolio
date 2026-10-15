import { flushSync } from "react-dom";
import { Monitor, Moon, Sun } from "lucide-react";

import { type ThemePreference, useSettings } from "@/contexts/SettingsContext";
import { translations } from "@/utils/translations";

/** The three choices, in the order every theme control shows them. */
export const THEME_MODES = [
  { mode: "system", Icon: Monitor, key: "themeSystem" },
  { mode: "light", Icon: Sun, key: "themeLight" },
  { mode: "dark", Icon: Moon, key: "themeDark" },
] as const;

/** The kit's entrance: the new theme spreads out from where it was chosen. */
const SPREAD_MS = 400;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * What a theme control needs: the reader's choice, each choice's name, and
 * the switch itself. The switch is the reader's own heat source: the new
 * theme is revealed as a circle growing from `origin`, once. Without view
 * transitions, or under reduced motion, it changes at once.
 */
export const useThemeSwitch = () => {
  const { language, themePreference, setThemePreference, systemTheme } = useSettings();
  const t = translations[language].common;

  /** A choice's name; System also says what the machine is set to now. */
  const nameOf = (mode: ThemePreference) => {
    if (mode !== "system") return mode === "light" ? t.themeLight : t.themeDark;
    const now = systemTheme === "light" ? t.themeLight : t.themeDark;
    return t.themeSystemNow.replace("{theme}", now.toLowerCase());
  };

  const switchTo = (mode: ThemePreference, origin: Element) => {
    if (mode === themePreference) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      setThemePreference(mode);
      return;
    }
    const rect = origin.getBoundingClientRect();
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

  return { preference: themePreference, nameOf, switchTo, t };
};
