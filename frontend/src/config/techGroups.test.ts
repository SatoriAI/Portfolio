import { readdirSync, readFileSync } from "fs";
import { describe, expect, it } from "vitest";

import { parseHeader } from "@/lib/workshop";

import { groupTechnologies, techGroupOf } from "./techGroups";
import { techIcon } from "./techIcons";

describe("groupTechnologies", () => {
  it("groups tags by what they do, in reading order, keeping their own order", () => {
    expect(groupTechnologies(["Python", "PostgreSQL", "FastAPI", "SQLAlchemy", "Railway"])).toEqual(
      [
        { group: "backend", tags: ["Python", "FastAPI", "SQLAlchemy"] },
        { group: "data", tags: ["PostgreSQL"] },
        { group: "cloud", tags: ["Railway"] },
      ],
    );
  });

  it("reads the services a project calls after its AI and before where it runs", () => {
    expect(groupTechnologies(["Railway", "Resend", "OpenAI"])).toEqual([
      { group: "ai", tags: ["OpenAI"] },
      { group: "services", tags: ["Resend"] },
      { group: "cloud", tags: ["Railway"] },
    ]);
  });

  it("puts an unknown tag under other instead of guessing", () => {
    expect(groupTechnologies(["Rust", "React"])).toEqual([
      { group: "frontend", tags: ["React"] },
      { group: "other", tags: ["Rust"] },
    ]);
  });

  it("knows every technology the project documents name", () => {
    const folder = new URL("../content/projects/", import.meta.url);
    const names = readdirSync(folder)
      .filter((file) => /\.(pl|en)\.md$/.test(file))
      .flatMap((file) =>
        parseHeader(readFileSync(new URL(file, folder), "utf8")).header.stack.split(","),
      )
      .map((name) => name.trim());
    expect(names.length).toBeGreaterThan(100);
    expect(names.filter((name) => techGroupOf(name) === "other")).toEqual([]);
  });
});

describe("techIcon", () => {
  it("draws a product without a mark of its own with its parent's", () => {
    expect(techIcon("SvelteKit")).toBe(techIcon("Svelte"));
    expect(techIcon("Google Maps Platform")).toBe(techIcon("Google Maps"));
  });

  it("has nothing for a name without a mark", () => {
    expect(techIcon("Alembic")).toBeUndefined();
  });
});
