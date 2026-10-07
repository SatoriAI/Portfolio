import type { UiProject } from "@/lib/projectsService";

/**
 * Where a project card itself goes when the whole card is a target.
 *
 * The demo wins when both exist: the kit frames a project as ending in a
 * verified result, and the running thing is that result. The repository stays
 * one click away on the card's own Code button.
 *
 * An empty string means the project is private, and a card with nowhere to go
 * must not imply that it is interactive.
 */
export const projectPrimaryHref = (project: UiProject) => project.demo || project.github || "";

const SITE_HOST = "dawidhanrahan.com";

/**
 * Whether a project is the site the visitor is reading. One of the projects
 * is this portfolio, and a list that includes the page you are on should say
 * so — it is the one project the visitor is already inside.
 *
 * Matched on the demo's host rather than the title, so renaming the project in
 * the admin cannot break it and a project merely called "Portfolio" cannot
 * claim it.
 */
export const isThisSite = (project: UiProject): boolean => {
  if (!project.demo) return false;
  try {
    return new URL(project.demo).hostname.replace(/^www\./, "") === SITE_HOST;
  } catch {
    return false;
  }
};
