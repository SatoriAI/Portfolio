import { describe, expect, it } from "vitest";

import { vexBundle } from "./vexKnowledge";

const doc = (title: string, body = "Tekst.") => `---\ntitle: ${title}\n---\n${body}\n`;

const files = {
  "workshop/heat.pl.md": doc("Ciepło"),
  "workshop/heat.en.md": doc("Heat"),
  "workshop/clock.pl.md": doc("Zegar"),
  "workshop/draft.en.draft.md": doc("Unpublished"),
  "projects/slip.en.md": doc("Slip", "Receipts."),
  "projects/slip.pl.md": doc("Slip", "Paragony."),
  "projects/README.md": "# Project documents",
};

describe("vexBundle", () => {
  it("gives each document once, in the reader's language, linked to its page", () => {
    expect(vexBundle(files, "en").sources).toEqual([
      { path: "/#projects", title: "Slip", text: "---\ntitle: Slip\n---\nReceipts." },
      { path: "/workshop/clock", title: "Zegar", text: "---\ntitle: Zegar\n---\nTekst." },
      { path: "/workshop/heat", title: "Heat", text: "---\ntitle: Heat\n---\nTekst." },
    ]);
  });

  it("falls back to the other language, and leaves out drafts and the README", () => {
    const titles = vexBundle(files, "pl").sources.map((source) => source.title);
    expect(titles).toEqual(["Slip", "Zegar", "Ciepło"]);
  });

  it("is the same bundle whatever order the files arrive in", () => {
    const reversed = Object.fromEntries(Object.entries(files).reverse());
    expect(vexBundle(reversed, "en")).toEqual(vexBundle(files, "en"));
  });
});
