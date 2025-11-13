import React, { createContext, useContext, useEffect, useState } from "react";

import { translations } from "@/utils/translations";

type Theme = "light" | "dark";
type Language = "en" | "pl";

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "dark";
  });

  const [language, setLanguageState] = useState<Language>(() => {
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

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Update document language, title and meta when language changes
  useEffect(() => {
    try {
      // html lang
      if (typeof document !== "undefined") {
        document.documentElement.lang = language;
      }
      // localized title
      const meta = translations[language]?.meta as
        | { title?: string; description?: string }
        | undefined;
      if (meta?.title) {
        document.title = meta.title;
      }
      // meta description
      if (meta?.description) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute("content", meta.description);
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && meta.title) ogTitle.setAttribute("content", meta.title);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute("content", meta.description);
      }
    } catch (_error) {
      // no-op
    }
  }, [language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <SettingsContext.Provider value={{ theme, language, toggleTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};
