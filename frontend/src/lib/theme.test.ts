import { describe, expect, it } from "vitest";

import { flipOverride, initialOverride, overrideFromStorage } from "./theme";

describe("initialOverride", () => {
  it("keeps a stored theme that differs from the machine's", () => {
    expect(initialOverride("dark", "light")).toBe("dark");
    expect(initialOverride("light", "dark")).toBe("light");
  });

  it("drops a stored theme the machine has caught up with", () => {
    expect(initialOverride("dark", "dark")).toBeNull();
    expect(initialOverride("light", "light")).toBeNull();
  });

  it("ignores nothing stored, and anything that is not a theme", () => {
    expect(initialOverride(null, "light")).toBeNull();
    expect(initialOverride("system", "dark")).toBeNull();
    expect(initialOverride("", "light")).toBeNull();
  });
});

describe("flipOverride", () => {
  it("stores the other theme when flipping away from the machine's", () => {
    expect(flipOverride("light", "light")).toBe("dark");
    expect(flipOverride("dark", "dark")).toBe("light");
  });

  it("stores nothing when flipping back to the machine's", () => {
    expect(flipOverride("dark", "light")).toBeNull();
    expect(flipOverride("light", "dark")).toBeNull();
  });

  it("changes the theme on every flip, two stops round", () => {
    for (const system of ["light", "dark"] as const) {
      let override = null as ReturnType<typeof flipOverride>;
      const seen: string[] = [];
      for (let i = 0; i < 4; i++) {
        override = flipOverride(override ?? system, system);
        seen.push(override ?? system);
      }
      const other = system === "light" ? "dark" : "light";
      expect(seen).toEqual([other, system, other, system]);
    }
  });
});

describe("overrideFromStorage", () => {
  it("follows another tab's flip away from the machine's theme", () => {
    expect(overrideFromStorage("theme", "dark", "light")).toBe("dark");
    expect(overrideFromStorage("theme", "light", "dark")).toBe("light");
  });

  it("follows the machine again when another tab flips back or clears", () => {
    expect(overrideFromStorage("theme", null, "light")).toBeNull();
    expect(overrideFromStorage(null, null, "dark")).toBeNull();
  });

  it("drops a stored theme equal to this machine's, as on load", () => {
    expect(overrideFromStorage("theme", "dark", "dark")).toBeNull();
  });

  it("ignores every other key", () => {
    expect(overrideFromStorage("languageChoice", "pl", "light")).toBeUndefined();
    expect(overrideFromStorage("vex_chat_session_key", "x", "dark")).toBeUndefined();
  });
});
