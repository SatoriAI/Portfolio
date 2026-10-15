/**
 * The theme's two stops, as pure rules: the machine's theme and the other
 * one. Only the other one is ever stored, so a stored value is a flip away
 * from the machine; one that matches the machine is no choice at all.
 */
export type Theme = "light" | "dark";

/** The stored choice worth keeping: a valid theme that differs from the machine's. */
export const initialOverride = (saved: string | null, system: Theme): Theme | null =>
  (saved === "light" || saved === "dark") && saved !== system ? saved : null;

/**
 * What to store after a flip from `current`: the other theme, unless that is
 * the machine's, in which case nothing, and the page follows the machine.
 */
export const flipOverride = (current: Theme, system: Theme): Theme | null => {
  const next: Theme = current === "light" ? "dark" : "light";
  return next === system ? null : next;
};
