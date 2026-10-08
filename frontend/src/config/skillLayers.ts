/**
 * The skills grouped by kind, so a reader scanning for a technology finds its
 * group at once: the languages and frameworks code is written in, the
 * databases and the architecture it is built to, the infrastructure it runs
 * on and the way it is deployed, and AI and the tools alongside. Four
 * groups, so the chart fits one screen; skills keyed by backend id, a skill
 * in no group shown after them all. Names are in the copy.
 */
export type SkillLayerKey = "languages" | "dataArchitecture" | "infrastructure" | "ai";

export const skillLayers: readonly { key: SkillLayerKey; skills: readonly number[] }[] = [
  { key: "languages", skills: [9, 1] },
  { key: "dataArchitecture", skills: [2, 12, 4] },
  { key: "infrastructure", skills: [3, 6, 8, 7] },
  { key: "ai", skills: [5, 10, 11] },
];
