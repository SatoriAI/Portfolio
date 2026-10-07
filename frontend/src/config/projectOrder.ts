/**
 * The order the home page shows the projects in, by the title the backend
 * gives each, the strongest work first. A project not listed here follows the
 * listed ones in the backend's order; a hidden one is left out (this site is
 * not shown as a project on itself).
 */
const ORDER = ["OpenGrant", "Konfio", "Athlo", "AdLume", "Slip", "Picko", "tURL"] as const;
const HIDDEN: readonly string[] = ["Portfolio"];

export const arrangeProjects = <T extends { title: string }>(projects: readonly T[]): T[] => {
  const rank = (title: string) => {
    const at = (ORDER as readonly string[]).indexOf(title);
    return at < 0 ? ORDER.length : at;
  };
  return projects
    .filter((project) => !HIDDEN.includes(project.title))
    .map((project, index) => ({ project, index }))
    .sort((a, b) => rank(a.project.title) - rank(b.project.title) || a.index - b.index)
    .map(({ project }) => project);
};
