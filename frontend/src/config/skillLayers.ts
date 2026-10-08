/**
 * The skills told as the path of one request, layer by layer: from the
 * interface and the API a visitor meets, through data and services, to the
 * platform it runs on and the way it is delivered, with AI and tools
 * alongside. Four layers, so the chart fits one screen; skills keyed by
 * backend id, a skill in no layer shown after them all. Names are in the copy.
 */
export type SkillLayerKey = "interfaceApi" | "dataServices" | "platformDelivery" | "ai";

export const skillLayers: readonly { key: SkillLayerKey; skills: readonly number[] }[] = [
  { key: "interfaceApi", skills: [9, 1] },
  { key: "dataServices", skills: [2, 4] },
  { key: "platformDelivery", skills: [3, 6, 8, 7] },
  { key: "ai", skills: [5, 10, 11] },
];
