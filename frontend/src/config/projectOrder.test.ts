import { describe, expect, it } from "vitest";

import { arrangeProjects } from "./projectOrder";

const titles = (list: { title: string }[]) => list.map((p) => p.title);

describe("arrangeProjects", () => {
  it("orders by the list, hides this site and keeps unlisted ones last in backend order", () => {
    const backend = [
      "tURL",
      "OpenGrant",
      "Zeta",
      "AdLume",
      "Portfolio",
      "Picko",
      "Alpha",
      "Slip",
      "Konfio",
      "Athlo",
    ];
    expect(titles(arrangeProjects(backend.map((title) => ({ title }))))).toEqual([
      "OpenGrant",
      "Konfio",
      "Athlo",
      "AdLume",
      "Slip",
      "Picko",
      "tURL",
      "Zeta",
      "Alpha",
    ]);
  });
});
