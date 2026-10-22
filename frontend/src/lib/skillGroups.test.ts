import { describe, expect, it } from "vitest";

import { type GroupableSkill, groupSkills, type SkillCategory } from "./skillGroups";

const languages: SkillCategory = { id: 1, order: 0, name: "Languages" };
const data: SkillCategory = { id: 2, order: 1, name: "Data" };

const skill = (id: number, order: number, category: SkillCategory | null): GroupableSkill => ({
  id,
  order,
  category,
});

describe("groupSkills", () => {
  it("orders groups by their category's order and skills by their own", () => {
    const groups = groupSkills([
      skill(2, 0, data),
      skill(1, 1, languages),
      skill(9, 0, languages),
      skill(12, 1, data),
    ]);
    expect(groups).toEqual([
      { key: "1", label: "Languages", skills: [9, 1] },
      { key: "2", label: "Data", skills: [2, 12] },
    ]);
  });

  it("breaks ties by id, for categories and skills alike", () => {
    const first = { id: 3, order: 0, name: "First" };
    const second = { id: 7, order: 0, name: "Second" };
    const groups = groupSkills([skill(5, 0, second), skill(4, 0, first), skill(2, 0, first)]);
    expect(groups.map((group) => group.key)).toEqual(["3", "7"]);
    expect(groups[0].skills).toEqual([2, 4]);
  });

  // The chart shows a skill no group names after all the groups.
  it("leaves a skill without a category out of every group", () => {
    const groups = groupSkills([skill(13, 0, null), skill(1, 0, languages)]);
    expect(groups).toEqual([{ key: "1", label: "Languages", skills: [1] }]);
  });

  it("makes no group for a category no skill is in", () => {
    expect(groupSkills([])).toEqual([]);
    expect(groupSkills([skill(13, 0, null)])).toEqual([]);
  });
});
