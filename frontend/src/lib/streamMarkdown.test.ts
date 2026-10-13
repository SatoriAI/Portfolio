import { describe, expect, it } from "vitest";

import { holdBackUnderline, normalizeMarkdown } from "./streamMarkdown";

describe("holdBackUnderline", () => {
  it("holds back a trailing line of dashes or equals signs", () => {
    expect(holdBackUnderline("A paragraph\n-")).toBe("A paragraph\n");
    expect(holdBackUnderline("A paragraph\n---")).toBe("A paragraph\n");
    expect(holdBackUnderline("A paragraph\n  ==")).toBe("A paragraph\n");
    expect(normalizeMarkdown(holdBackUnderline("A paragraph\n--"))).toBe("A paragraph\n");
  });

  it("shows the line once more of it arrives", () => {
    expect(holdBackUnderline("Intro\n- item")).toBe("Intro\n- item");
    expect(holdBackUnderline("Intro\n---\n")).toBe("Intro\n---\n");
    expect(holdBackUnderline("Intro\n-- not a rule")).toBe("Intro\n-- not a rule");
  });

  it("leaves dashes inside a line alone", () => {
    expect(holdBackUnderline("one - two")).toBe("one - two");
    expect(holdBackUnderline("---")).toBe("---");
  });
});

describe("normalizeMarkdown", () => {
  it("always ends with a newline", () => {
    expect(normalizeMarkdown("abc")).toBe("abc\n");
  });

  // The core streaming problem: a code fence opened by one chunk has no closing
  // fence until a later one, and react-markdown would swallow everything after it.
  it("closes a code fence that the stream has not closed yet", () => {
    expect(normalizeMarkdown("```js\nconsole.log(1)")).toBe("```js\nconsole.log(1)\n```\n");
  });

  // Regression: a closing fence at the end of the text used to look identical to
  // an opening one, so every answer ending in code gained an empty code block.
  it("leaves an already-closed fence alone", () => {
    const closed = "```js\nconsole.log(1)\n```\n";
    expect(normalizeMarkdown(closed)).toBe(closed);
  });

  it("leaves a closed fence alone even without a trailing newline", () => {
    expect(normalizeMarkdown("```\ncode\n```")).toBe("```\ncode\n```\n");
  });

  // Regression: the numbered-list rule ran over the whole string, so `foo(1) bar`
  // inside a code block was rewritten to `foo(\n1) bar`.
  it("does not rewrite list-like text inside a code block", () => {
    const code = "```\nfoo(1) bar\n```\n";
    expect(normalizeMarkdown(code)).toBe(code);
  });

  it("does not touch headings or bullets inside a code block", () => {
    const code = "```\n# not a heading\n• not a bullet\n```\n";
    expect(normalizeMarkdown(code)).toBe(code);
  });

  it("preserves blank lines inside a code block", () => {
    const code = "```\nfirst\n\n\n\nlast\n```\n";
    expect(normalizeMarkdown(code)).toBe(code);
  });

  // Inline constructs are not fences. ~~ in particular used to be counted by a
  // /~~~?/ scan over the whole string.
  it("does not mistake strikethrough for a code fence", () => {
    expect(normalizeMarkdown("a ~~struck~~ b")).toBe("a ~~struck~~ b\n");
  });

  it("does not mistake inline code for a code fence", () => {
    expect(normalizeMarkdown("use `npm ci` here")).toBe("use `npm ci` here\n");
  });

  it("closes an unterminated tilde fence with a tilde fence", () => {
    expect(normalizeMarkdown("~~~\ncode")).toBe("~~~\ncode\n~~~\n");
  });

  // It runs on every render, so applying it to its own output must be a no-op.
  it.each(["plain text", "```\ncode\n```\n", "```js\nunterminated", "• bullet"])(
    "is idempotent for %j",
    (input) => {
      const once = normalizeMarkdown(input);
      expect(normalizeMarkdown(once)).toBe(once);
    },
  );

  it("rewrites bullet characters the model emits as markdown list items", () => {
    expect(normalizeMarkdown("• first")).toBe("- first\n");
    expect(normalizeMarkdown("— first")).toBe("- first\n");
  });

  it("rewrites a bullet character at any indent and keeps the blank line before it", () => {
    expect(normalizeMarkdown("intro\n\n  • nested")).toBe("intro\n\n  - nested\n");
  });

  // The stream once lost newlines, and rules that put them back by guessing
  // broke prose and loosened lists. With the text arriving intact, prose is
  // left as the model wrote it.
  it.each([
    ["a dash in a sentence", "2020 - 2024 at the lab"],
    ["a hash in a sentence", "issue # 5 was fixed"],
    ["a number in a sentence", "version 2. Then"],
    ["a tight list", "- one\n- two"],
    ["a heading after a line of text", "text\n## Heading"],
  ])("leaves %s alone", (_case, text) => {
    expect(normalizeMarkdown(text)).toBe(`${text}\n`);
  });

  it("normalises CRLF", () => {
    expect(normalizeMarkdown("a\r\nb")).toBe("a\nb\n");
  });
});
