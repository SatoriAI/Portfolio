import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@/entry-server";
import { renderAfresh } from "@/hooks/use-hydrated";

// React 18 says this of every useLayoutEffect it meets on the server.
const LAYOUT_EFFECT_NOTICE = "useLayoutEffect does nothing on the server";

const stamp = { created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" };
const project = (id: number, title: string) => ({
  ...stamp,
  id,
  title,
  translations: { en: { description: "Made up." }, pl: { description: "Zmyślony." } },
  image: "",
  tags: ["Python"],
  demo: `https://${title.toLowerCase()}.example`,
  repository: "",
});
// The first is the open one; both have an icon and a screenshot in the site's config.
const snapshot = {
  fetchedAt: Date.UTC(2026, 9, 1),
  lists: { projects: [project(1, "OpenGrant"), project(2, "Konfio")] },
};

/** The files the home page's HTML names in an <img src>. */
const imageSources = async () => {
  const { html } = await render("/", snapshot);
  return [...html.matchAll(/<img[^>]*?\ssrc="([^"]+)"/g)].map((match) => match[1]);
};

describe("the home page's images", () => {
  let errors: unknown[][];
  beforeEach(() => {
    errors = [];
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes(LAYOUT_EFFECT_NOTICE)) errors.push(args);
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    expect(errors).toEqual([]);
  });

  // Fetched at parse time, hidden images competed with the bundle on a slow
  // line; the browser fetches them once it has taken the page over.
  it("name only the open frame's icon in the page's HTML", async () => {
    expect(await imageSources()).toEqual(["/projects/icons/opengrant.png"]);
  });

  // Last: renderAfresh holds for the rest of this file, as for a page the
  // browser draws itself, which is what a page is once taken over.
  it("name every file once the browser has the page", async () => {
    renderAfresh();
    const sources = await imageSources();
    for (const file of [
      "/projects/icons/opengrant.png",
      "/projects/icons/konfio.svg",
      "/projects/opengrant.webp",
      "/projects/konfio.webp",
      "/avatar.webp",
    ]) {
      expect(sources).toContain(file);
    }
  });
});
