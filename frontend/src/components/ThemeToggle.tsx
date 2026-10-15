import { THEME_MODES, useThemeSwitch } from "@/hooks/use-theme-switch";
import { cn } from "@/lib/utils";

/**
 * System / Light / Dark as a segmented control with words, for the menu
 * sheet, where there is room for all three. The pressed segment is the
 * reader's choice, System included, so it always shows whether the page is
 * following the machine. The segments share the sheet's width, each word
 * under its icon: side by side, the Polish words outgrow a phone's sheet.
 */
const ThemeToggle = ({ className }: { className?: string }) => {
  const { preference, nameOf, switchTo, t } = useThemeSwitch();

  return (
    <div
      role="group"
      aria-label={t.appearance}
      className={cn(
        "flex w-full rounded-xl border border-control-border bg-card p-1 text-meta font-medium",
        className,
      )}
    >
      {THEME_MODES.map(({ mode, Icon, key }) => {
        const active = mode === preference;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            aria-label={nameOf(mode)}
            onClick={(event) => switchTo(mode, event.currentTarget)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors duration-200",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-lavender hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {t[key]}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
