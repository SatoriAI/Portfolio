import { describe, expect, it } from "vitest";

import { autoLanguageRedirect, languageOf, localizedPath, stripLanguage } from "./locale";

describe("the language in an address", () => {
  it("is Polish under /pl, in any case and with or without a slash", () => {
    for (const path of ["/pl", "/pl/", "/PL/Research", "/pl/workshop/heat", "/pl#about", "/pl?x"]) {
      expect(languageOf(path)).toBe("pl");
    }
  });

  it("is English anywhere else, a path merely starting with pl included", () => {
    for (const path of ["/", "/research", "/plan", "/workshop/pl"]) {
      expect(languageOf(path)).toBe("en");
    }
  });

  it("is added and taken off without touching the rest", () => {
    expect(localizedPath("pl", "/")).toBe("/pl");
    expect(localizedPath("pl", "/#projects")).toBe("/pl#projects");
    expect(localizedPath("pl", "/research")).toBe("/pl/research");
    expect(localizedPath("en", "/research")).toBe("/research");
    expect(stripLanguage("/pl")).toBe("/");
    expect(stripLanguage("/pl#projects")).toBe("/#projects");
    expect(stripLanguage("/PL/research?x=1#y")).toBe("/research?x=1#y");
    expect(stripLanguage("/plan")).toBe("/plan");
  });
});

describe("autoLanguageRedirect", () => {
  const polish = ["pl-PL", "en-GB"];

  it("sends a Polish browser that has never chosen from the English home page to /pl", () => {
    expect(autoLanguageRedirect({ pathname: "/", choice: null, browserLanguages: polish })).toBe(
      "/pl",
    );
    expect(autoLanguageRedirect({ pathname: "/", choice: null, browserLanguages: ["PL"] })).toBe(
      "/pl",
    );
  });

  it("keeps any choice made with the toggle, English included", () => {
    expect(autoLanguageRedirect({ pathname: "/", choice: "en", browserLanguages: polish })).toBe(
      null,
    );
    expect(autoLanguageRedirect({ pathname: "/", choice: "pl", browserLanguages: polish })).toBe(
      null,
    );
  });

  it("never moves any other address, nor a browser that prefers another language", () => {
    for (const pathname of ["/research", "/workshop/heat", "/pl", "/nope"]) {
      expect(autoLanguageRedirect({ pathname, choice: null, browserLanguages: polish })).toBe(null);
    }
    for (const browserLanguages of [["en-US", "pl-PL"], ["de"], []]) {
      expect(autoLanguageRedirect({ pathname: "/", choice: null, browserLanguages })).toBe(null);
    }
  });
});
