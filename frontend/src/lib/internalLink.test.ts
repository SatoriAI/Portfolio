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
    expect(internalPath("https://www.dawidhanrahan.com/experience#nokia", origin)).toBe(
      "/experience#nokia",
    );
    expect(internalPath("https://dawidhanrahan.com/education", origin)).toBe("/education");
    expect(internalPath("http://localhost:8080/research?x=1", "http://localhost:8080")).toBe(
      "/research?x=1",
    );
  });

  it("leaves other sites, other schemes and protocol-relative links to a new tab", () => {
    expect(internalPath("https://picko.world", origin)).toBeNull();
    expect(internalPath("//evil.example/research", origin)).toBeNull();
    expect(internalPath("mailto:dawid@example.com", origin)).toBeNull();
    expect(internalPath("javascript:alert(1)", origin)).toBeNull();
    expect(internalPath(undefined, origin)).toBeNull();
  });
});
