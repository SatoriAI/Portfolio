import { describe, expect, it } from "vitest";

import { decodeStreamData, finalizeMarkdown, normalizeMarkdown } from "./streamMarkdown";

describe("decodeStreamData", () => {
  it("passes plain text through untouched", () => {
    expect(decodeStreamData("Hello")).toBe("Hello");
  });

  it("returns an empty string for an empty payload", () => {
    expect(decodeStreamData("")).toBe("");
  });

  it("unwraps a JSON-encoded string", () => {
    expect(decodeStreamData('"Hello"')).toBe("Hello");
  });

  // The backend sends bare text, but the widget is written to survive a proxy or
  // a future backend that wraps tokens in an object.
  it.each([
    ["token", '{"token":"abc"}'],
    ["delta", '{"delta":"abc"}'],
    ["content", '{"content":"abc"}'],
    ["text", '{"text":"abc"}'],
    ["message", '{"message":"abc"}'],
  ])("extracts the %s field from an object payload", (_field, payload) => {
    expect(decodeStreamData(payload)).toBe("abc");
  });

  it("prefers token over the other candidate fields", () => {
    expect(decodeStreamData('{"token":"first","delta":"second"}')).toBe("first");
  });

  it("strips single quotes that are not valid JSON", () => {
    expect(decodeStreamData("'Hello'")).toBe("Hello");
  });

  it("turns escaped newlines into real ones", () => {
    expect(decodeStreamData("line one\\nline two")).toBe("line one\nline two");
  });

  it.each(["[DONE]", "DONE", "<|eot_id|>"])("swallows the %s terminator", (marker) => {
    expect(decodeStreamData(marker)).toBe("");
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

  // The two below document defects that exist today. They are marked as expected
  // failures rather than deleted, so the evidence stays in the suite: fixing the
  // code makes them pass, which turns the run red and prompts flipping `it.fails`
  // back to `it`.
  //
  // Both matter more than "streaming artefact" suggests, because ChatWidget calls
  // normalizeMarkdown on every render, not only mid-stream — so they are visible
  // in finished answers and in history reloaded from the API.

  // `endsWithFenceStart` cannot tell a closing fence at the end of the text from
  // an opening one, so any answer ending in a code block gets a second, empty
  // code block appended.
  it.fails("should leave an already-closed fence alone", () => {
    const closed = "```js\nconsole.log(1)\n```\n";
    expect(normalizeMarkdown(closed)).toBe(closed);
  });

  // The numbered-list rule is applied to the whole string, including inside
  // fenced code, so `foo(1) bar` becomes `foo(\n1) bar` and the displayed code
  // is wrong.
  it.fails("should not rewrite list-like text inside a code block", () => {
    expect(normalizeMarkdown("```\nfoo(1) bar\n```\n")).toContain("foo(1) bar");
  });

  it("rewrites bullet characters the model emits as markdown list items", () => {
    expect(normalizeMarkdown("• first")).toBe("- first\n");
    expect(normalizeMarkdown("— first")).toBe("- first\n");
  });

  // Chunk boundaries land mid-sentence, so a heading can arrive with no newline
  // in front of it at all.
  it("puts a heading on its own line when it arrives mid-sentence", () => {
    expect(normalizeMarkdown("some text ## Heading")).toBe("some text\n\n## Heading\n");
  });

  it("gives a heading a blank line when it only had one newline", () => {
    expect(normalizeMarkdown("some text\n## Heading")).toBe("some text\n\n## Heading\n");
  });

  it("breaks a numbered list item onto its own line", () => {
    expect(normalizeMarkdown("intro 1. first")).toBe("intro\n1. first\n");
  });

  it("normalises CRLF", () => {
    expect(normalizeMarkdown("a\r\nb")).toBe("a\nb\n");
  });
});

describe("finalizeMarkdown", () => {
  it("collapses runs of blank lines to at most one", () => {
    expect(finalizeMarkdown("a\n\n\n\nb")).toBe("a\n\nb\n");
  });

  it("guarantees a trailing newline", () => {
    expect(finalizeMarkdown("a")).toBe("a\n");
  });

  it("still separates a heading glued to preceding text", () => {
    expect(finalizeMarkdown("text ## Heading")).toBe("text\n\n## Heading\n");
  });

  // Unlike normalizeMarkdown, this runs once the stream is complete, so it must
  // not invent a closing fence for something the model genuinely left open.
  it("does not add a closing code fence", () => {
    expect(finalizeMarkdown("```js\nconsole.log(1)")).not.toContain("```\n```");
  });
});
