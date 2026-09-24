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
