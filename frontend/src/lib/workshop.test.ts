import { describe, expect, it } from "vitest";

import {
  articlesFor,
  formatDate,
  parseArticle,
  parseHeader,
  readingMinutes,
  splitSections,
} from "./workshop";

const file = (header: string, body = "Tekst.") => `---\n${header}\n---\n${body}`;

describe("parseHeader", () => {
  it("reads key: value lines, keeping colons inside values", () => {
    const { header, body } = parseHeader(file('title: "Fale: na zegarze"\ndate: 2026-10-01'));
    expect(header).toEqual({ title: "Fale: na zegarze", date: "2026-10-01" });
    expect(body).toBe("Tekst.");
  });

  it("leaves a file without a header as all body", () => {
    expect(parseHeader("Just text.")).toEqual({ header: {}, body: "Just text." });
  });
});

describe("readingMinutes", () => {
  it("rounds up at 200 words a minute, and never says zero", () => {
    expect(readingMinutes("słowo ".repeat(201))).toBe(2);
    expect(readingMinutes("")).toBe(1);
  });
});

describe("parseArticle", () => {
  const header = "title: Grokking\ndate: 2026-10-01\nformat: figure\nsummary: Trzy przebiegi.";

  it("takes the slug and language from the file name", () => {
    const article = parseArticle("/src/content/workshop/grokking.pl.md", file(header));
    expect(article).toMatchObject({ slug: "grokking", language: "pl", draft: false });
  });

  it("reads its tags as a trimmed list, and none when there are none", () => {
    const tagged = parseArticle(
      "grokking.pl.md",
      file(`${header}\ntags: grokking, transformery , arytmetyka modularna`),
    );
    expect(tagged.tags).toEqual(["grokking", "transformery", "arytmetyka modularna"]);
    expect(parseArticle("grokking.pl.md", file(header)).tags).toEqual([]);
  });

  it("marks a draft by its file name", () => {
    expect(parseArticle("grokking.en.draft.md", file(header))).toMatchObject({
      slug: "grokking",
      language: "en",
      draft: true,
    });
  });

  it("refuses a file without a language in its name, or without a date", () => {
    expect(() => parseArticle("grokking.md", file(header))).toThrow();
    expect(() => parseArticle("grokking.pl.md", file("title: X\nformat: proof"))).toThrow();
  });
});

describe("articlesFor", () => {
  const make = (slug: string, language: "pl" | "en", date: string, draft = false) =>
    parseArticle(
      `${slug}.${language}${draft ? ".draft" : ""}.md`,
      file(`title: ${slug}\ndate: ${date}\nformat: proof`),
    );
  const all = [
    make("old", "pl", "2026-01-01"),
    make("old", "en", "2026-01-01"),
    make("new", "pl", "2026-05-01"),
    make("wip", "pl", "2026-09-01", true),
  ];

  it("shows each piece once, newest first, in the reader's language where it exists", () => {
    const shown = articlesFor(all, "en");
    expect(shown.map((a) => [a.slug, a.language, a.inOtherLanguage])).toEqual([
      ["new", "pl", true],
      ["old", "en", false],
    ]);
  });

  it("leaves drafts out unless asked for", () => {
    expect(articlesFor(all, "pl").map((a) => a.slug)).not.toContain("wip");
    expect(articlesFor(all, "pl", { drafts: true })[0].slug).toBe("wip");
  });
});

describe("formatDate", () => {
  it("writes the date in full", () => {
    expect(formatDate("2026-10-01", "pl")).toBe("1 października 2026");
    expect(formatDate("2026-10-01", "en")).toBe("1 October 2026");
  });
});

describe("splitSections", () => {
  it("cuts at ## headings, keeping the part before the first", () => {
    expect(splitSections("Intro.\n\n## One\n\nText one.\n\n## Two\n\nText two.")).toEqual([
      { heading: undefined, body: "Intro." },
      { heading: "One", body: "Text one." },
      { heading: "Two", body: "Text two." },
    ]);
  });

  it("starts with a heading when there is no intro, and leaves ### alone", () => {
    expect(splitSections("## One\n\n### Sub\n\nText.")).toEqual([
      { heading: "One", body: "### Sub\n\nText." },
    ]);
  });

  it("treats a ## inside a code block as code", () => {
    const [only] = splitSections("```\n## not a heading\n```");
    expect(only.heading).toBeUndefined();
    expect(only.body).toContain("## not a heading");
  });

  it("gives each footnote's definition to the section that cites it", () => {
    const sections = splitSections("A[^a].\n\n## B\n\nB[^b].\n\n[^a]: Note a.\n[^b]: Note b.");
    expect(sections[0].body).toBe("A[^a].\n\n[^a]: Note a.");
    expect(sections[1].body).toBe("B[^b].\n\n[^b]: Note b.");
  });
});
