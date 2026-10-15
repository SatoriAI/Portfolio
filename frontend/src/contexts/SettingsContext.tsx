import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "pl";
export type Theme = "light" | "dark";

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
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

/** Puts a theme on the page at once. index.html does the same before the first
 *  paint; this keeps it in step afterwards, synchronously, so a view
 *  transition captures the new theme in its callback. */
const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", THEME_COLOR[theme]);
  });
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("language") as Language | null;
      if (saved === "en" || saved === "pl") return saved;
    } catch (_error) {
      console.error(_error);
    }

    if (typeof navigator !== "undefined") {
      const raw =
        Array.isArray(navigator.languages) && navigator.languages.length > 0
          ? navigator.languages
          : navigator.language
            ? [navigator.language]
            : [];
      const browserLanguages = raw.filter(Boolean);
      const primary = (browserLanguages[0] || "en").toLowerCase();
      const suggested: Language = primary.startsWith("pl") ? "pl" : "en";
      return suggested;
    }

    return "en";
  });

  // There are two stops, the machine's theme and the other one, so only the
  // other one is ever stored: a choice equal to the machine's is no choice.
  const [system, setSystem] = useState<Theme>(systemTheme);
  const [override, setOverride] = useState<Theme | null>(() => {
    try {
      const saved = localStorage.getItem("theme");
      if ((saved === "light" || saved === "dark") && saved !== systemTheme()) return saved;
    } catch (_error) {
      console.error(_error);
    }
    return null;
  });
  const theme = override ?? system;

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

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Titles and descriptions are per page (usePageMeta); only the document
  // language is global.
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

  useEffect(() => applyTheme(theme), [theme]);

  const flipTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    applyTheme(next);
    setOverride(next === system ? null : next);
  };

  return (
    <SettingsContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        flipTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
