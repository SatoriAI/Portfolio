import { useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

import type { ThemePreference } from "@/contexts/SettingsContext";
import { THEME_MODES, useThemeSwitch } from "@/hooks/use-theme-switch";
import { cn } from "@/lib/utils";

/**
 * The theme control for the menu bar: one 40 px button beside the language
 * toggle, its icon the reader's choice (System included), opening System /
 * Light / Dark. Three segments there cost the bar the room between the logo
 * and the links; the menu sheet keeps them (ThemeToggle). A small chevron
 * says it opens a menu, since at rest it otherwise looks like a segment of
 * the language toggle beside it, which switches at once.
 */
const ThemeMenu = ({ className }: { className?: string }) => {
  const { preference, nameOf, switchTo, t } = useThemeSwitch();
  const trigger = useRef<HTMLButtonElement>(null);
  const { Icon } = THEME_MODES.find(({ mode }) => mode === preference) ?? THEME_MODES[0];
  const label = `${t.appearance}: ${nameOf(preference)}`;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        ref={trigger}
        aria-label={label}
        title={label}
        className={cn(
          "group inline-flex size-10 items-center justify-center gap-0.5 rounded-xl border border-control-border bg-card text-foreground transition-colors duration-200 hover:bg-lavender data-[state=open]:bg-lavender",
          className,
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
        {/* 12 px, under the kit's 16 px icon size, so drawn heavier to keep
          the set's stroke weight; it turns while the menu is open. */}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2.5}
          className="size-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-48 rounded-xl border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <DropdownMenu.Label className="px-3 pb-1 pt-2 font-mono text-meta font-medium uppercase tracking-widest text-muted-foreground">
            {t.appearance}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={preference}
            // The circle grows from the button, which stays where it was
            // while the menu closes.
            onValueChange={(mode) =>
              trigger.current && switchTo(mode as ThemePreference, trigger.current)
            }
          >
            {THEME_MODES.map(({ mode, Icon: ModeIcon }) => (
              <DropdownMenu.RadioItem
                key={mode}
                value={mode}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 outline-none transition-colors duration-200 data-[highlighted]:bg-lavender data-[state=checked]:font-medium"
              >
                <ModeIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="flex-1">{nameOf(mode)}</span>
                <DropdownMenu.ItemIndicator>
                  <Check aria-hidden="true" className="size-4 text-iris" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default ThemeMenu;
