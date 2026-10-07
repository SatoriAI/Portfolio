import { describe, expect, it } from "vitest";

import { sentencesOf, splitSentences } from "./sentences";

describe("sentencesOf", () => {
  it("keeps a Polish abbreviation inside its sentence", () => {
    expect(
      sentencesOf("Badałem to na trudniejszej przestrzeni, tj. na stożku. Potem dalej."),
    ).toEqual(["Badałem to na trudniejszej przestrzeni, tj. na stożku.", "Potem dalej."]);
    expect(sentencesOf("Skupiłem się na tzw. domains of revolution. Ćwiczenia też.")).toEqual([
      "Skupiłem się na tzw. domains of revolution.",
      "Ćwiczenia też.",
    ]);
  });
});

describe("splitSentences", () => {
  it("gives the first sentences and the rest", () => {
    expect(splitSentences("One. Two. Three.", 2)).toEqual(["One. Two.", "Three."]);
    expect(splitSentences("One. Two.", 2)).toEqual(["One. Two.", ""]);
  });
});
