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
    const { html } = await render(address);
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

    const { html, modules } = await render(`/pl/workshop/${slug}`);
    // The chunks the page is taken over with, for the build to link.
    expect(modules).toEqual([
      "src/pages/WorkshopArticle.tsx",
      `src/content/workshop/${slug}.pl.md`,
    ]);
    const text = textOf(html);
    expect(text).toContain(words(piece.title));
    expect(text).toContain(sentence);
  });

  describe("with the API's lists", () => {
    // Made up, one of each, as the API would answer: every translation at once.
    const stamp = { created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" };
    const snapshot = {
      fetchedAt: Date.UTC(2026, 9, 1),
      lists: {
        projects: [
          {
            ...stamp,
            id: 1,
            title: "Sample Project",
            translations: { en: { description: "Made up." }, pl: { description: "Zmyślony." } },
            image: "",
            tags: ["Python"],
            demo: "",
            repository: "",
          },
        ],
        experiences: [
          {
            ...stamp,
            id: 1,
            translations: { en: { role: "Engineer" }, pl: { role: "Inżynier" } },
            position: "Engineer",
            start: "2024-02-01",
            end: "",
            company: "Sample Company",
            technologies: ["Python"],
          },
        ],
        skills: [
          {
            ...stamp,
            id: 1,
            translations: { en: { name: "Sample Skill" }, pl: { name: "Próbna umiejętność" } },
            since: null,
            since_launch: false,
            icon: "Code",
          },
        ],
        publications: [
          {
            ...stamp,
            id: 1,
            translations: {
              en: { title: "A Sample Paper", summary: "Made up." },
              pl: { title: "Próbna praca", summary: "Zmyślona." },
            },
            journal: "Sample Journal",
            link: "",
            year: 2025,
          },
        ],
        schools: [
          {
            ...stamp,
            id: 1,
            translations: { en: { study: "Mathematics" }, pl: { study: "Matematyka" } },
            start: "2020-10-01",
            end: "",
            degree: "Master's",
          },
        ],
        testimonials: [
          {
            ...stamp,
            id: 1,
            translations: {
              en: { course: "Algebra", content: "A sample testimonial." },
              pl: { course: "Algebra", content: "Próbna opinia." },
            },
            semester: "2023/24",
            season: "Winter",
          },
        ],
      },
    };
    const pages = [
      ["/", ["projects"], "Sample Project"],
      ["/pl/experience", ["experiences", "skills", "projects"], "Próbna umiejętność"],
      ["/research", ["publications"], "A Sample Paper"],
      ["/pl/research", ["publications"], "Próbna praca"],
      ["/education", ["schools", "testimonials"], "A sample testimonial."],
    ] as const;

    it.each(pages)("renders %s with its lists, none loading", async (address, lists, text) => {
      const page = await render(address, snapshot);
      expect(textOf(page.html)).toContain(text);
      expect(page.html).not.toContain('role="status"');
      // What the page's HTML carries for the browser: the lists it read, and only those.
      expect(page.lists).toEqual({
        fetchedAt: snapshot.fetchedAt,
        lists: Object.fromEntries(lists.map((name) => [name, snapshot.lists[name]])),
      });
      expect(errors).toEqual([]);
    });

    it("renders them loading without a snapshot, and gives a page with no list none", async () => {
      expect((await render("/research")).html).toContain('role="status"');
      expect((await render("/workshop", snapshot)).lists).toBeUndefined();
    });
  });

  it("writes each language's own words, and only its own", async () => {
    const english = textOf((await render("/research")).html);
    const polish = textOf((await render("/pl/research")).html);
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
