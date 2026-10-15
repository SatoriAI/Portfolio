import { describe, expect, it } from "vitest";

import { VEX_LANGUAGES, vexBundle } from "./vexKnowledge";
import { readVexContent } from "./vexKnowledgeFiles";

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

const sha256 = async (text: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

describe("the bundles the build publishes", () => {
  // Read with the build's own reader, from the files the build reads. Vex's
  // evals read the same files with a copy of vexBundle (fixture.py in
  // backend/portfolio/vex/tests/evals), and its test_fixture.py compares what
  // that copy makes of them with this same snapshot. A change to the content
  // or to either reader fails a test until the snapshot is rewritten on
  // purpose (`cd frontend && npx vitest run -u src/lib/vexKnowledge.test.ts`)
  // and both readers agree with it again. Each text is held by its digest, so
  // the snapshot copies no article.
  it("match the snapshot the backend's evals are checked against", async () => {
    const content = await readVexContent();
    const snapshot: Record<string, unknown> = {};
    for (const language of VEX_LANGUAGES) {
      snapshot[language] = await Promise.all(
        vexBundle(content, language).sources.map(async ({ path, title, text }) => ({
          path,
          title,
          sha256: await sha256(text),
        })),
      );
    }
    await expect(`${JSON.stringify(snapshot, null, 2)}\n`).toMatchFileSnapshot(
      "../../../backend/portfolio/vex/tests/evals/site_sources.json",
    );
  });
});
