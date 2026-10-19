import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { describe, expect, it } from "vitest";

import { SettingsProvider } from "@/contexts/SettingsContext";
import { renderAfresh } from "@/hooks/use-hydrated";

import LanguageToggle from "./LanguageToggle";

/** The toggle's links at `address`, as rendered in one pass. */
const hrefs = (address: string) =>
  [
    ...renderToString(
      createElement(
        StaticRouter,
        { location: address },
        createElement(SettingsProvider, {
          language: "en",
          children: createElement(LanguageToggle),
        }),
      ),
    ).matchAll(/href="([^"]+)"/g),
  ].map(([, href]) => href);

describe("LanguageToggle", () => {
  // In one test, in this order: renderAfresh holds for the rest of the module.
  it("links the address's query and #item only once the page is taken over", () => {
    // As the build renders it, and as the browser's takeover must match: it
    // cannot know the query or the #item a reader will arrive with.
    expect(hrefs("/education?x=1#2019")).toEqual(["/education", "/pl/education"]);
    // Rendered in the browser, where it knows them.
    renderAfresh();
    expect(hrefs("/education?x=1#2019")).toEqual(["/education?x=1#2019", "/pl/education?x=1#2019"]);
  });
});
