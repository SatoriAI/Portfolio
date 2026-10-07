import { describe, expect, it } from "vitest";

import { segmentQuote, themeCounts, themesIn } from "./quoteThemes";

const text = "He explains issues clearly and is always prepared. Such legible handwriting.";

describe("segmentQuote", () => {
  it("cuts the quote around each phrase found, in reading order", () => {
    expect(
      segmentQuote(text, {
        prepared: ["always prepared"],
        clarity: ["explains issues clearly"],
      }),
    ).toEqual([
      { text: "He " },
      { text: "explains issues clearly", theme: "clarity" },
      { text: " and is " },
      { text: "always prepared", theme: "prepared" },
      { text: ". Such legible handwriting." },
    ]);
  });

  it("matches across bound and plain spaces, and keeps the quote's own", () => {
    const quote = "Zajęcia w\u00a0przyjaznej atmosferze i dobre.";
    const segments = segmentQuote(quote, { enjoyable: ["w przyjaznej atmosferze"] });
    expect(segments[1]).toEqual({ text: "w\u00a0przyjaznej atmosferze", theme: "enjoyable" });
    expect(
      themesIn("Zajęcia w przyjaznej atmosferze.", { enjoyable: ["w\u00a0przyjaznej"] }),
    ).toEqual(new Set(["enjoyable"]));
  });

  it("leaves the quote whole when no phrase is found", () => {
    expect(segmentQuote(text, { kindness: ["very kind"] })).toEqual([{ text }]);
  });

  it("keeps the earlier of two overlapping phrases", () => {
    const segments = segmentQuote(text, {
      clarity: ["explains issues clearly"],
      other: ["issues clearly and"],
    });
    expect(segments.filter((segment) => segment.theme).map((s) => s.theme)).toEqual(["clarity"]);
  });
});

describe("themeCounts", () => {
  it("counts a quote once per theme it says, and only by phrases found", () => {
    const quotes: { text: string; phrases: Record<string, string[]> }[] = [
      { text, phrases: { clarity: ["explains issues clearly"], handwriting: ["legible"] } },
      {
        text: "Very kind and clear.",
        phrases: { clarity: ["no longer here"], kindness: ["kind"] },
      },
    ];
    expect(themeCounts(quotes, ["clarity", "kindness", "handwriting", "beyond"])).toEqual({
      clarity: 1,
      kindness: 1,
      handwriting: 1,
      beyond: 0,
    });
  });

  it("reads the themes of one quote from what is found in it", () => {
    expect(themesIn(text, { clarity: ["explains"], kindness: ["kind"] })).toEqual(
      new Set(["clarity"]),
    );
  });
});
