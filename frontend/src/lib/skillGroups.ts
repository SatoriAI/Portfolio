/**
 * The skills grouped by their category, as the backend files them: groups in
 * the categories' order, skills in their own order within each, ties broken
 * by id so the order never depends on the answer's. A skill in no category
 * is in no group; the chart shows it after them all. Pure, so the ordering
 * can be tested without the page.
 */

export type SkillCategory = { id: number; order: number; name: string };

export type GroupableSkill = { id: number; order: number; category: SkillCategory | null };

export type SkillGroup = { key: string; label: string; skills: number[] };

export function groupSkills(skills: readonly GroupableSkill[]): SkillGroup[] {
  const groups = new Map<number, { category: SkillCategory; members: GroupableSkill[] }>();
  for (const skill of skills) {
    if (!skill.category) continue;
    const group = groups.get(skill.category.id);
    if (group) group.members.push(skill);
    else groups.set(skill.category.id, { category: skill.category, members: [skill] });
  }
  return [...groups.values()]
    .sort((a, b) => a.category.order - b.category.order || a.category.id - b.category.id)
    .map(({ category, members }) => ({
      key: String(category.id),
      label: category.name,
      skills: members.sort((a, b) => a.order - b.order || a.id - b.id).map(({ id }) => id),
    }));
}
