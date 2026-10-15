import { describe, expect, it } from "vitest";

import { pages } from "@/config/navigation";

import { pageMeta, pageMetaPaths } from "./pageMeta";
import type { ArticleHeader } from "./workshop";

const SITE = "https://www.dawidhanrahan.com";

const piece = (slug: string, language: "en" | "pl", title: string): ArticleHeader => ({
  slug,
  language,
  title,
  date: "2026-10-01",
  format: "figure",
  summary: `${title}, briefly`,
  showcase: false,
  tags: [],
  draft: false,
  minutes: 1,
});
const pieces = [
  piece("heat", "en", "Heat"),
  piece("heat", "pl", "Ciepło"),
  piece("clock", "en", "Clock"),
];

describe("pageMeta", () => {
  it("has its own title and description for every standalone page", () => {
    expect(pageMetaPaths).toEqual(["/", ...pages.map((page) => page.to)]);
  });

  it("gives each language its own text and canonical, alternates the same in both", () => {
    const en = pageMeta("/research", "en", pieces);
    const pl = pageMeta("/research", "pl", pieces);
    expect(en.title).not.toBe(pl.title);
    expect(en.canonical).toBe(`${SITE}/research`);
    expect(pl.canonical).toBe(`${SITE}/pl/research`);
    expect(pl.alternates).toEqual(en.alternates);
    expect(en.alternates).toEqual([
      { hreflang: "en", href: `${SITE}/research` },
      { hreflang: "pl", href: `${SITE}/pl/research` },
      { hreflang: "x-default", href: `${SITE}/research` },
    ]);
  });

  it("names each page's alternates exactly as that page names its canonical", () => {
    for (const path of [...pageMetaPaths, "/workshop/heat"]) {
      const heads = (["en", "pl"] as const).map((language) => pageMeta(path, language, pieces));
      for (const head of heads) {
        expect(head.alternates.find((a) => a.hreflang === head.language)?.href).toBe(
          head.canonical,
        );
      }
    }
    expect(pageMeta("/", "en", pieces).canonical).toBe(`${SITE}/`);
    expect(pageMeta("/", "pl", pieces).canonical).toBe(`${SITE}/pl`);
  });

  it("is lower case, without a trailing slash, whatever the address's form", () => {
    expect(pageMeta("/Experience/", "pl", pieces).canonical).toBe(`${SITE}/pl/experience`);
  });

  it("titles a piece as the page shows it, in the reader's language", () => {
    expect(pageMeta("/workshop/heat", "pl", pieces)).toMatchObject({
      title: "Ciepło · Dawid Hanrahan",
      description: "Ciepło, briefly",
      canonical: `${SITE}/pl/workshop/heat`,
    });
  });

  it("points a piece in one language only at that language, without alternates", () => {
    for (const language of ["en", "pl"] as const) {
      expect(pageMeta("/workshop/clock", language, pieces)).toMatchObject({
        language,
        title: "Clock · Dawid Hanrahan",
        canonical: `${SITE}/workshop/clock`,
        alternates: [],
      });
    }
  });

  it("gives an unknown address the not-found text and no address at all", () => {
    for (const path of ["/nope", "/workshop/nope", "/workshop/heat/more"]) {
      const head = pageMeta(path, "pl", pieces);
      expect(head.title).toBe("Nie znaleziono strony · Dawid Hanrahan");
      expect(head.canonical).toBeNull();
      expect(head.alternates).toEqual([]);
    }
  });
});
