import { afterEach, describe, expect, it, vi } from "vitest";

import { type ApiPublication, mapApiPublicationToUi } from "./publicationsService";

const publication = (year: number): ApiPublication => ({
  id: 1,
  translations: { en: { title: "A Sample Paper", summary: "Made up." } },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  journal: "Sample Journal",
  link: "",
  year,
});

describe("mapApiPublicationToUi", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps the year the API gives", () => {
    expect(mapApiPublicationToUi(publication(2025), "en").year).toBe(2025);
  });

  it("gives no year when the API has none, whatever the clock says", () => {
    // The build and the reader can be on either side of New Year: a year
    // taken from the clock would differ between the page and its takeover.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T23:59:00Z"));
    expect(mapApiPublicationToUi(publication(0), "en").year).toBeNull();
  });
});
