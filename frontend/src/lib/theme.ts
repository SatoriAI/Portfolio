/**
 * The theme's two stops, as pure rules: the machine's theme and the other
 * one. Only the other one is ever stored, so a stored value is a flip away
 * from the machine; one that matches the machine is no choice at all.
 */
export type Theme = "light" | "dark";

/** The theme a page's data-theme names: dark only when it says so. */
export const themeOf = (value: string | undefined): Theme => (value === "dark" ? "dark" : "light");

/** The stored choice worth keeping: a valid theme that differs from the machine's. */
export const initialOverride = (saved: string | null, system: Theme): Theme | null =>
  (saved === "light" || saved === "dark") && saved !== system ? saved : null;

/**
 * What another tab's write to storage means here, or `undefined` when it is
 * not about the theme. A cleared storage (`key` null) means no choice, and a
 * value equal to this machine's theme is no choice either, as on load.
 */
export const overrideFromStorage = (
  key: string | null,
  newValue: string | null,
  system: Theme,
): Theme | null | undefined => {
  if (key !== "theme" && key !== null) return undefined;
  return initialOverride(key === null ? null : newValue, system);
};

/**
 * What to store after a flip from `current`: the other theme, unless that is
 * the machine's, in which case nothing, and the page follows the machine.
 */
export const flipOverride = (current: Theme, system: Theme): Theme | null => {
  const next: Theme = current === "light" ? "dark" : "light";
  return next === system ? null : next;
};
