import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "pl";
/** What the reader chose; "system" follows the machine and stores nothing. */
export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  /** The theme on screen: the preference, or the machine's under "system". */
  theme: Theme;
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

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (_error) {
      console.error(_error);
    }
    return "system";
  });
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = themePreference === "system" ? system : themePreference;

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Titles and descriptions are per page (usePageMeta); only the document
  // language is global.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Under "system" the page follows the machine live, without a reload.
  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY);
    if (!query) return;
    const onChange = () => setSystem(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => applyTheme(theme), [theme]);

  // A choice is remembered; choosing System again forgets it.
  const setThemePreference = (preference: ThemePreference) => {
    try {
      if (preference === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", preference);
    } catch (_error) {
      console.error(_error);
    }
    applyTheme(preference === "system" ? systemTheme() : preference);
    setThemePreferenceState(preference);
  };

  return (
    <SettingsContext.Provider
      value={{ language, setLanguage, themePreference, setThemePreference, theme }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
