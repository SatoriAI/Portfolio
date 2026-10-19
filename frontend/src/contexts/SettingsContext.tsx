import React, { createContext, useContext, useEffect, useState } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import type { Language } from "@/lib/locale";
import {
  flipOverride,
  initialOverride,
  overrideFromStorage,
  type Theme,
  themeOf,
} from "@/lib/theme";

export type { Theme };

interface SettingsContextType {
  /** The page's language, as its address names it (lib/locale.ts). */
  language: Language;
  /** The theme on screen: the machine's, unless the reader flipped it. */
  theme: Theme;
  /** Switches to the other theme. Flipping back to the machine's own theme
   *  forgets the choice, so the page follows the machine again. */
  flipTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

/** The theme on screen, for painting outside CSS (the heat fields' canvases).
 *  Light outside a provider, so a brand component renders on its own. */
export const useTheme = (): Theme => useContext(SettingsContext)?.theme ?? "light";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const systemTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";

// The theme-color metas index.html declares, one per scheme; the chosen theme
// overrides both, so the browser's chrome matches the page and not the machine.
const THEME_COLOR: Record<Theme, string> = { light: "#F8F9FC", dark: "#0E1424" };

/** The theme on the page now, as boot.js or applyTheme put it there; light
 *  where there is no page, at build time. */
const themeOnPage = (): Theme =>
  typeof document === "undefined" ? "light" : themeOf(document.documentElement.dataset.theme);

/** Puts a theme on the page at once. index.html does the same before the first
 *  paint; this keeps it in step afterwards, synchronously, so a view
 *  transition captures the new theme in its callback. */
const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", THEME_COLOR[theme]);
  });
};

/**
 * The language holds for the whole visit: the language toggle is a link to
 * the page's address in the other language, which loads afresh.
 */
export const SettingsProvider: React.FC<{ language: Language; children: React.ReactNode }> = ({
  language,
  children,
}) => {
  // There are two stops, the machine's theme and the other one, so only the
  // other one is ever stored: a choice equal to the machine's is no choice.
  const [system, setSystem] = useState<Theme>(systemTheme);
  const [override, setOverride] = useState<Theme | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return initialOverride(localStorage.getItem("theme"), systemTheme());
    } catch (_error) {
      console.error(_error);
    }
    return null;
  });
  // Nothing in the markup reads this theme: what differs by theme (the
  // toggle, the brand marks) follows the page's data-theme in CSS. Only the
  // heat fields' canvases paint by it, and they paint while the browser takes
  // a page over, so until then it is the theme boot.js put on the page
  // before the first paint, not a guess: a dark reader's fields never paint
  // a light frame. At build time there is no page, and nothing paints.
  const hydrated = useHydrated();
  const theme = hydrated ? (override ?? system) : themeOnPage();

  // Stored and in state stay in step: a saved choice the machine has since
  // caught up with is forgotten, so the next flip always changes the page.
  useEffect(() => {
    try {
      if (override) localStorage.setItem("theme", override);
      else localStorage.removeItem("theme");
    } catch (_error) {
      console.error(_error);
    }
  }, [override]);

  // Each page's HTML already names its language; 404.html, shared by both,
  // is English until the app has read the address.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Unflipped, the page follows the machine live, without a reload. When the
  // machine turns to the theme the reader flipped to, the flip is spent.
  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY);
    if (!query) return;
    const onChange = () => {
      const next: Theme = query.matches ? "dark" : "light";
      setSystem(next);
      setOverride((current) => (current === next ? null : current));
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // A flip in another tab arrives as a storage event (never in the tab that
  // wrote it), and the same rule as on load decides whether it is a choice.
  // Writing the same value back changes nothing, so no event bounces back.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const next = overrideFromStorage(event.key, event.newValue, systemTheme());
      if (next !== undefined) setOverride(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) applyTheme(theme);
  }, [hydrated, theme]);

  // From what is on the page and what the machine says now, not from this
  // render's closure: two flips before a re-render must flip twice.
  const flipTheme = () => {
    const current = themeOnPage();
    const machine = systemTheme();
    const override = flipOverride(current, machine);
    applyTheme(override ?? machine);
    setOverride(override);
  };

  return (
    <SettingsContext.Provider value={{ language, theme, flipTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};
