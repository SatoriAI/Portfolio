import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "pl";

interface SettingsContextType {
  language: Language;
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

// The Visual Identity Kit defines a light theme only, so the site has no theme
// setting; language is the one preference that persists.
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

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Titles and descriptions are per page (usePageMeta); only the document
  // language is global.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <SettingsContext.Provider value={{ language, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};
