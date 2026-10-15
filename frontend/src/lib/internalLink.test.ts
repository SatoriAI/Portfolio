import { describe, expect, it } from "vitest";

import { internalPath } from "./internalLink";

const origin = "https://www.dawidhanrahan.com";

describe("internalPath", () => {
  it("keeps the site's own paths and anchors", () => {
    expect(internalPath("/research", origin)).toBe("/research");
    expect(internalPath("/#projects", origin)).toBe("/#projects");
    expect(internalPath("/workshop/intelligence-from-heat", origin)).toBe(
      "/workshop/intelligence-from-heat",
    );
    expect(internalPath("#contact", origin)).toBe("#contact");
  });

  it("turns the site's full address into a path, on any of its hosts", () => {
    expect(internalPath("https://www.dawidhanrahan.com/experience#gridwhistle", origin)).toBe(
      "/experience#gridwhistle",
    );
    expect(internalPath("https://dawidhanrahan.com/education", origin)).toBe("/education");
    expect(internalPath("http://localhost:8080/research?x=1", "http://localhost:8080")).toBe(
      "/research?x=1",
    );
  });

  it("drops a language prefix, which the router adds back in the reader's language", () => {
    expect(internalPath("https://www.dawidhanrahan.com/pl/research", origin)).toBe("/research");
    expect(internalPath("https://www.dawidhanrahan.com/pl", origin)).toBe("/");
    expect(internalPath("/pl/workshop/heat#proof", origin)).toBe("/workshop/heat#proof");
    expect(internalPath("/pl#projects", origin)).toBe("/#projects");
    expect(internalPath("/plan", origin)).toBe("/plan");
  });

  it("leaves other sites, other schemes and protocol-relative links to a new tab", () => {
    expect(internalPath("https://tallyfox.example.com", origin)).toBeNull();
    expect(internalPath("//evil.example/research", origin)).toBeNull();
    expect(internalPath("mailto:jan@example.com", origin)).toBeNull();
    expect(internalPath("javascript:alert(1)", origin)).toBeNull();
    expect(internalPath(undefined, origin)).toBeNull();
  });
});
