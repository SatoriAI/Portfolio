import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, sitePages } from "./entry-server";
import { parseArticle } from "./lib/workshop";
import { translations } from "./utils/translations";

// React 18 says this of every useLayoutEffect it meets on the server, and
// rightly does nothing: what those effects measure, the browser measures.
const LAYOUT_EFFECT_NOTICE = "useLayoutEffect does nothing on the server";

/** Words as a reader compares them: the typesetting's no-break spaces and joiners as plain spacing. */
const words = (text: string) => text.replace(/⁠/g, "").replace(/\s+/g, " ");

/** The words of a page, without its markup. */
const textOf = (html: string) =>
  words(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&"),
  );

describe("the page render at build time", () => {
  let errors: unknown[][];
  beforeEach(() => {
    errors = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes(LAYOUT_EFFECT_NOTICE)) errors.push(args);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(sitePages.map((page) => page.address))("renders %s, warning-free", async (address) => {
    const html = await render(address);
    expect(html).toContain('<main id="content"');
    expect(errors).toEqual([]);
  });

  it("writes a Polish piece in Polish, its text included", async () => {
    const slug = "intelligence-from-heat";
    const file = fileURLToPath(new URL(`content/workshop/${slug}.pl.md`, import.meta.url));
    const piece = parseArticle(`${slug}.pl.md`, readFileSync(file, "utf8"));
    // A plain paragraph of the text, one without Markdown inside it.
    const sentence = piece.body
      .split(/\n\s*\n/)
      .map((paragraph) => words(paragraph.trim()))
      .find((paragraph) => paragraph.length > 80 && /^[\p{L}\p{N} ,.;:?!’—–-]+$/u.test(paragraph));
    expect(sentence).toBeDefined();

    const text = textOf(await render(`/pl/workshop/${slug}`));
    expect(text).toContain(words(piece.title));
    expect(text).toContain(sentence);
  });

  it("writes each language's own words, and only its own", async () => {
    const english = textOf(await render("/research"));
    const polish = textOf(await render("/pl/research"));
    const own = (language: "en" | "pl") =>
      [translations[language].nav.skipToContent, translations[language].common.tagline].map(words);
    for (const word of own("en")) {
      expect(english).toContain(word);
      expect(polish).not.toContain(word);
    }
    for (const word of own("pl")) {
      expect(polish).toContain(word);
      expect(english).not.toContain(word);
    }
  });
});
