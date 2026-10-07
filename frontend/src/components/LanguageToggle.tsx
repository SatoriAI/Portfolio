import { useSettings } from "@/contexts/SettingsContext";
import { cn } from "@/lib/utils";
import { translations } from "@/utils/translations";

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "pl", label: "PL", name: "Polski" },
] as const;

type LanguageToggleProps = {
  className?: string;
};

/** Segmented EN / PL control; the pressed segment is the active language. */
const LanguageToggle = ({ className }: LanguageToggleProps) => {
  const { language, setLanguage } = useSettings();
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
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            aria-label={name}
            onClick={() => setLanguage(code)}
            className={cn(
              "h-full rounded-lg px-2.5 transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-lavender hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
