import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  appRewrites,
  canonicalPath,
  publishedPieceSlugs,
  sitemapXml,
  sitePaths,
} from "./siteMap";

describe("canonicalPath", () => {
  it("drops a trailing slash but keeps the root", () => {
    expect(canonicalPath("/experience/")).toBe("/experience");
    expect(canonicalPath("/workshop/heat")).toBe("/workshop/heat");
    expect(canonicalPath("/")).toBe("/");
  });

  it("gives absolute addresses on the www host", () => {
    expect(absoluteUrl("/")).toBe("https://www.dawidhanrahan.com/");
    expect(absoluteUrl("/research/")).toBe("https://www.dawidhanrahan.com/research");
  });
});

describe("publishedPieceSlugs", () => {
  it("lists each published piece once, whatever its languages, and no drafts", () => {
    const files = {
      "workshop/heat.en.md": "",
      "workshop/heat.pl.md": "",
      "workshop/clock.pl.md": "",
      "workshop/unfinished.en.draft.md": "",
      "projects/slip.en.md": "",
      "projects/README.md": "",
    };
    expect(publishedPieceSlugs(files)).toEqual(["clock", "heat"]);
  });
});

describe("the site's addresses", () => {
  const paths = sitePaths(["/experience", "/workshop"], ["clock", "heat"]);

  it("are home, the pages and every piece", () => {
    expect(paths).toEqual(["/", "/experience", "/workshop", "/workshop/clock", "/workshop/heat"]);
  });

  it("make a sitemap of absolute addresses", () => {
    const xml = sitemapXml(paths);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.match(/<loc>/g)).toHaveLength(paths.length);
    expect(xml).toContain("<loc>https://www.dawidhanrahan.com/workshop/heat</loc>");
  });

  it("each answer with the app; nothing else does", () => {
    const rewrites = appRewrites(paths);
    expect(rewrites.map((rewrite) => rewrite.source)).toEqual(paths);
    expect(new Set(rewrites.map((rewrite) => rewrite.destination))).toEqual(
      new Set(["/index.html"]),
    );
  });
});
