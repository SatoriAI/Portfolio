import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { pages, redirects } from "@/config/navigation";

import { pageMeta } from "./pageMeta";
import {
  absoluteUrl,
  canonicalPath,
  localizedRedirects,
  notFoundHtml,
  pageAddresses,
  pageFile,
  publishedPieces,
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

const files = {
  "workshop/heat.en.md": piece("Heat"),
  "workshop/heat.pl.md": piece("Ciepło"),
  "workshop/clock.pl.md": piece("Zegar"),
  "workshop/unfinished.en.draft.md": piece("Draft"),
  "projects/slip.en.md": "",
};

describe("publishedPieceSlugs", () => {
  it("lists each published piece once, whatever its languages, and no drafts", () => {
    expect(publishedPieceSlugs(publishedPieces(files))).toEqual(["clock", "heat"]);
  });
});

describe("the site's addresses", () => {
  const paths = sitePaths(["/experience", "/workshop"], ["clock", "heat"]);

  it("are home, the pages and every piece", () => {
    expect(paths).toEqual(["/", "/experience", "/workshop", "/workshop/clock", "/workshop/heat"]);
  });

  it("are each in both languages, each in a file of its own", () => {
    const addresses = pageAddresses(["/", "/experience"]).map(({ address }) => address);
    expect(addresses).toEqual(["/", "/experience", "/pl", "/pl/experience"]);
    expect(addresses.map(pageFile)).toEqual([
      "index.html",
      "experience/index.html",
      "pl/index.html",
      "pl/experience/index.html",
    ]);
  });

  it("make a sitemap of canonical addresses, each with its alternates", () => {
    const pieces = publishedPieces(files);
    const heads = pageAddresses(paths).map(({ language, path }) =>
      pageMeta(path, language, pieces),
    );
    const xml = sitemapXml(heads);
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    // Every page twice, but clock, written in Polish only, once.
    expect(xml.match(/<loc>/g)).toHaveLength(paths.length * 2 - 1);
    expect(xml).toContain("<loc>https://www.dawidhanrahan.com/pl/workshop/heat</loc>");
    expect(xml).toContain("<loc>https://www.dawidhanrahan.com/pl/workshop/clock</loc>");
    expect(xml).not.toContain("<loc>https://www.dawidhanrahan.com/workshop/clock</loc>");
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://www.dawidhanrahan.com/workshop/heat"/>',
    );
    expect(xml.match(/<xhtml:link/g)).toHaveLength((paths.length - 1) * 2 * 3);
  });

  it("cover every published piece, as the site's own parser reads the folder", async () => {
    const built = sitePaths(
      pages.map((page) => page.to),
      publishedPieceSlugs(publishedPieces(await readVexContent())),
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
    // Every `path=` in the file, in any quoting and wherever it sits among
    // the attributes: a string, a string in braces, or an expression.
    const PATH = /\bpath=(?:"([^"]*)"|'([^']*)'|\{\s*(["'`])(.*?)\3\s*\}|\{([^}]*)\})/g;
    const found = [...source("../App.tsx").matchAll(PATH)];
    const literals = found
      .map((match) => match[1] ?? match[2] ?? match[4])
      .filter((path) => path !== undefined);
    const expressions = found.map((match) => match[5]?.trim()).filter(Boolean);
    expect(literals.length).toBeGreaterThan(0);

    // The redirects' own routes, mapped from navigation.ts.
    expect(expressions).toEqual(["from"]);
    // A route with a parameter must be listed here, with how its addresses
    // reach the server; /workshop/:slug from the published pieces.
    const parameterRoutes = ["/workshop/:slug"];
    for (const path of literals.filter((path) => path.includes(":"))) {
      expect(parameterRoutes).toContain(path);
    }
    for (const path of literals.filter((path) => path !== "*" && !path.includes(":"))) {
      expect(known).toContain(path);
    }
  });
});

describe("serveConfig", () => {
  const addresses = ["/", "/experience", "/pl", "/pl/experience"];
  const moved = localizedRedirects([{ from: "/academic", to: "/research" }]);

  it("answers each address with its own file and old ones with a 301, in both languages", () => {
    const security = { source: "**", headers: [{ key: "X-Frame-Options", value: "DENY" }] };
    const config = serveConfig({ headers: [security] }, addresses, moved);
    expect(config.rewrites).toEqual([
      { source: "/", destination: "/index.html" },
      { source: "/experience", destination: "/experience/index.html" },
      { source: "/pl", destination: "/pl/index.html" },
      { source: "/pl/experience", destination: "/pl/experience/index.html" },
    ]);
    expect(config.redirects).toEqual([
      { source: "/academic", destination: "/research", type: 301 },
      { source: "/pl/academic", destination: "/pl/research", type: 301 },
    ]);
    // Others' headers kept, then a page asked about on every visit, the bundle kept for good.
    expect(config.headers?.map((entry) => entry.source)).toEqual(["**", "**/*.html", "assets/**"]);
    expect(config.headers?.[0]).toBe(security);
  });

  it("gives the same file when merged twice, and keeps routes it does not own", () => {
    const other = { source: "/elsewhere", destination: "/other.html" };
    const once = serveConfig({ rewrites: [other] }, addresses, moved);
    expect(serveConfig(once, addresses, moved)).toEqual(once);
    expect(once.rewrites).toContainEqual(other);
  });
});

describe("notFoundHtml", () => {
  it("takes the canonical and og:url out of the real index.html, and nothing else", () => {
    const index = source("../../index.html");
    const page = notFoundHtml(index);
    expect(page).not.toMatch(/<link rel="canonical"|property="og:url"/);
    // Nor does it name a language's address: the app reads that from the address.
    expect(page).not.toMatch(/hreflang="|property="og:locale/);
    expect(page).toContain('property="og:image"');
    expect(index.length - page.length).toBeLessThan(200);
  });

  it("refuses an index.html whose tags it cannot find", () => {
    expect(() => notFoundHtml("<html></html>")).toThrow();
  });
});
