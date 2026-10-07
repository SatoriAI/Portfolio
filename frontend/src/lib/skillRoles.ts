/**
 * The roles in which a skill was used, found from each role's own technology
 * list and the technologies that prove the skill. Names are compared without
 * regard to case. Pure, so the matching can be tested without the page.
 */

export type RoleTechnologies<Id> = { id: Id; technologies: readonly string[] };

export function rolesForSkill<Id>(
  evidence: readonly string[],
  roles: readonly RoleTechnologies<Id>[],
): Id[] {
  const wanted = new Set(evidence.map((name) => name.toLowerCase()));
  return roles
    .filter((role) => role.technologies.some((tech) => wanted.has(tech.toLowerCase())))
    .map((role) => role.id);
}
