import { describe, expect, it } from "vitest";

import { rolesForSkill } from "./skillRoles";

const roles = [
  { id: 1, technologies: ["Python", "PostgreSQL", "Kubernetes", "AWS"] },
  { id: 2, technologies: ["python", "OpenStack"] },
  { id: 3, technologies: ["Python", "PostreSQL"] },
];

describe("rolesForSkill", () => {
  it("finds every role whose technologies name one of the skill's", () => {
    expect(rolesForSkill(["AWS", "OpenStack"], roles)).toEqual([1, 2]);
  });

  it("compares names without regard to case", () => {
    expect(rolesForSkill(["Python"], roles)).toEqual([1, 2, 3]);
  });

  it("does not guess at a misspelt technology", () => {
    expect(rolesForSkill(["PostgreSQL"], roles)).toEqual([1]);
  });

  it("finds nothing for a skill without evidence", () => {
    expect(rolesForSkill([], roles)).toEqual([]);
  });
});
