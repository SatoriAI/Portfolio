import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { LANGUAGE_CHOICE_KEY } from "./locale";

// public/boot.js itself, run against a stand-in for the page it starts.
const source = readFileSync(
  fileURLToPath(new URL("../../public/boot.js", import.meta.url)),
  "utf8",
);

const boot = ({
  path = "/",
  languages = ["en-GB"],
  stored = {} as Record<string, string>,
  dark = false,
  storageThrows = false,
} = {}) => {
  const { pathname, search, hash } = new URL(path, "https://www.dawidhanrahan.com");
  const replaced: string[] = [];
  const location = { pathname, search, hash, replace: (url: string) => void replaced.push(url) };
  const localStorage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error("blocked");
      return stored[key] ?? null;
    },
  };
  const navigator = { languages, language: languages[0] };
  const document = { documentElement: { dataset: {} as Record<string, string> } };
  const matchMedia = () => ({ matches: dark });
  new Function("location", "localStorage", "navigator", "document", "matchMedia", source)(
    location,
    localStorage,
    navigator,
    document,
    matchMedia,
  );
  return { replaced, theme: document.documentElement.dataset.theme };
};

const polish = ["pl-PL", "en-GB"];

describe("boot.js, the language", () => {
  it("sends a Polish browser that has never chosen from the English home page to /pl", () => {
    expect(boot({ languages: polish }).replaced).toEqual(["/pl"]);
    expect(boot({ path: "/?ref=x#about", languages: ["PL"] }).replaced).toEqual([
      "/pl?ref=x#about",
    ]);
  });

  it("keeps any choice made with the toggle, English included", () => {
    for (const choice of ["en", "pl"]) {
      const stored = { [LANGUAGE_CHOICE_KEY]: choice };
      expect(boot({ languages: polish, stored }).replaced).toEqual([]);
    }
  });

  it("ignores the old language key, written on every visit and so no choice", () => {
    expect(boot({ languages: polish, stored: { language: "en" } }).replaced).toEqual(["/pl"]);
  });

  it("never moves any other address, nor a browser that prefers another language", () => {
    for (const path of ["/research", "/workshop/heat", "/pl", "/nope"]) {
      expect(boot({ path, languages: polish }).replaced).toEqual([]);
    }
    for (const languages of [["en-US", "pl-PL"], ["de"], []]) {
      expect(boot({ languages }).replaced).toEqual([]);
    }
  });
});

describe("boot.js, the theme", () => {
  it("is the stored choice, else the machine's", () => {
    expect(boot().theme).toBe("light");
    expect(boot({ dark: true }).theme).toBe("dark");
    expect(boot({ stored: { theme: "light" }, dark: true }).theme).toBe("light");
    expect(boot({ storageThrows: true, dark: true }).theme).toBe("dark");
  });

  it("is left alone when the page is leaving for /pl", () => {
    expect(boot({ languages: polish, dark: true }).theme).toBeUndefined();
  });
});
