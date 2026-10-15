import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { pages, redirects } from "@/config/navigation";

import {
  absoluteUrl,
  canonicalPath,
  notFoundHtml,
  publishedPieceSlugs,
  serveConfig,
  sitemapXml,
  sitePaths,
} from "./siteMap";
import { readVexContent } from "./vexKnowledgeFiles";
import { parseArticle } from "./workshop";

const source = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

describe("canonicalPath", () => {
  it("is lower case, without a trailing slash, and keeps the root", () => {
    expect(canonicalPath("/experience/")).toBe("/experience");
    expect(canonicalPath("/Workshop/Heat")).toBe("/workshop/heat");
    expect(canonicalPath("/")).toBe("/");
  });

  it("gives absolute addresses on the www host", () => {
    expect(absoluteUrl("/")).toBe("https://www.dawidhanrahan.com/");
    expect(absoluteUrl("/Research/")).toBe("https://www.dawidhanrahan.com/research");
  });
});

const piece = (title: string) =>
  `---\ntitle: ${title}\ndate: 2026-10-01\nformat: figure\n---\nText.`;

describe("publishedPieceSlugs", () => {
  it("lists each published piece once, whatever its languages, and no drafts", () => {
    const files = {
      "workshop/heat.en.md": piece("Heat"),
      "workshop/heat.pl.md": piece("Ciepło"),
      "workshop/clock.pl.md": piece("Zegar"),
      "workshop/unfinished.en.draft.md": piece("Draft"),
      "projects/slip.en.md": "",
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

  it("cover every published piece, as the site's own parser reads the folder", async () => {
    const built = sitePaths(
      pages.map((page) => page.to),
      publishedPieceSlugs(await readVexContent()),
    );
    const folder = fileURLToPath(new URL("../content/workshop", import.meta.url));
    const published = readdirSync(folder)
      .filter((name) => name.endsWith(".md"))
      .map((name) => parseArticle(name, readFileSync(`${folder}/${name}`, "utf8")))
      .filter((article) => !article.draft);
    expect(published.length).toBeGreaterThan(0);
    for (const article of published) expect(built).toContain(`/workshop/${article.slug}`);
  });

  it("cover every route App.tsx declares, so none 404s on a direct load", () => {
    const known = new Set([
      ...sitePaths(
        pages.map((page) => page.to),
        [],
      ),
      ...redirects.map((r) => r.from),
    ]);
    const declared = [...source("../App.tsx").matchAll(/<Route[^>]*\spath="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path !== "*" && !path.includes(":"));
    expect(declared.length).toBeGreaterThan(0);
    for (const path of declared) expect(known).toContain(path);
  });
});

describe("serveConfig", () => {
  const paths = ["/", "/experience"];
  const moved = [{ from: "/academic", to: "/research" }];

  it("answers known paths with the app and old ones with a 301, over others' settings", () => {
    const headers = [{ source: "**", headers: [] }];
    const config = serveConfig({ headers }, paths, moved);
    expect(config.headers).toBe(headers);
    expect(config.rewrites).toEqual([
      { source: "/", destination: "/index.html" },
      { source: "/experience", destination: "/index.html" },
    ]);
    expect(config.redirects).toEqual([
      { source: "/academic", destination: "/research", type: 301 },
    ]);
  });

  it("gives the same file when merged twice, and keeps routes it does not own", () => {
    const other = { source: "/elsewhere", destination: "/other.html" };
    const once = serveConfig({ rewrites: [other] }, paths, moved);
    expect(serveConfig(once, paths, moved)).toEqual(once);
    expect(once.rewrites).toContainEqual(other);
  });
});

describe("notFoundHtml", () => {
  it("takes the canonical and og:url out of the real index.html, and nothing else", () => {
    const index = source("../../index.html");
    const page = notFoundHtml(index);
    expect(page).not.toMatch(/<link rel="canonical"|property="og:url"/);
    expect(page).toContain('property="og:image"');
    expect(index.length - page.length).toBeLessThan(200);
  });

  it("refuses an index.html whose tags it cannot find", () => {
    expect(() => notFoundHtml("<html></html>")).toThrow();
  });
});
