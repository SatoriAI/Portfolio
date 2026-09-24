import { describe, expect, it } from "vitest";

import { projectPrimaryHref } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";

const project = (github: string, demo: string): UiProject => ({
  title: "Example",
  description: "",
  technologies: [],
  image: "",
  github,
  demo,
});

describe("projectPrimaryHref", () => {
  it("prefers the demo when a project has both", () => {
    expect(projectPrimaryHref(project("https://repo", "https://demo"))).toBe("https://demo");
  });

  it("falls back to the repository", () => {
    expect(projectPrimaryHref(project("https://repo", ""))).toBe("https://repo");
  });

  it("uses the demo when there is no repository", () => {
    expect(projectPrimaryHref(project("", "https://demo"))).toBe("https://demo");
  });

  it("is empty for a private project, so the card is not made actionable", () => {
    expect(projectPrimaryHref(project("", ""))).toBe("");
  });
});
