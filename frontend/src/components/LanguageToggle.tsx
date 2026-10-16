import { useLocation } from "react-router-dom";

import { useSettings } from "@/contexts/SettingsContext";
import { useHydrated } from "@/hooks/use-hydrated";
import { localizedPath, storeLanguageChoice } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "pl", label: "PL", name: "Polski" },
] as const;

type LanguageToggleProps = {
  className?: string;
};

/**
 * Segmented EN / PL control; the marked segment is the active language.
 * Each segment is a link to this page's address in its language, which
 * loads afresh, and remembers the choice, so the home page never moves a
 * reader who has chosen (lib/locale.ts).
 */
const LanguageToggle = ({ className }: LanguageToggleProps) => {
  const { language } = useSettings();
  const { pathname, search, hash } = useLocation();
  // The address's query and #item only once the page is taken over: the
  // build rendered it without either, and the takeover must match.
  const rest = useHydrated() ? `${search}${hash}` : "";
  const t = translations[language];

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn(
        "inline-flex h-10 items-center rounded-xl border border-control-border bg-card p-1 font-mono text-xs",
        className,
      )}
    >
      {LANGUAGES.map(({ code, label, name }) => {
        const active = code === language;
        return (
          <a
            key={code}
            href={`${localizedPath(code, pathname)}${rest}`}
            hrefLang={code}
            lang={code}
            aria-current={active ? "true" : undefined}
            aria-label={name}
            onClick={(event) => {
              storeLanguageChoice(code);
              // Already this language: the choice is noted, the page stays.
              if (active) event.preventDefault();
            }}
            className={cn(
              // A finger's 44 px: the hit area reaches past the pill above and
              // below, and outward at the ends, where nothing else is pressed.
              "relative inline-flex h-full items-center rounded-lg px-2.5 transition-colors duration-200",
              "after:absolute after:-inset-y-[7px] after:left-0 after:right-0 first:after:-left-2.5 last:after:-right-2.5",
              // Chosen: navy in light, lavender with an iris edge in dark. The
              // other segment's hover is the panel tint, so in dark it never
              // looks chosen; in light the two lavenders are one.
              active
                ? "bg-chosen text-chosen-foreground shadow-[inset_0_0_0_1px_hsl(var(--chosen-edge))]"
                : "text-muted-foreground hover:bg-lavender hover:text-foreground",
            )}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
