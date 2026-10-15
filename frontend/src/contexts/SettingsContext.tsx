import React, { createContext, useContext, useEffect, useMemo } from "react";

import type { Language } from "@/lib/locale";

interface SettingsContextType {
  language: Language;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

/**
 * The language of the page, as its address names it (lib/locale.ts). It
 * holds for the whole visit: the toggle is a link to the page's address in
 * the other language, which loads afresh. The Visual Identity Kit's light
 * theme is the only one, so language is the one setting.
 */
export const SettingsProvider: React.FC<{ language: Language; children: React.ReactNode }> = ({
  language,
  children,
}) => {
  // Each page's HTML already names its language; 404.html, shared by both,
  // is English until the app has read the address.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language }), [language]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
