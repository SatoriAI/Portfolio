import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsProvider, useTheme } from "./SettingsContext";

/** Writes the theme the heat fields would paint by, as the render sees it. */
const Probe = () => createElement("span", null, useTheme());

/** A render before hydration: no effect has run, as while the browser takes a page over. */
const firstRender = () =>
  renderToString(
    createElement(SettingsProvider, { language: "en", children: createElement(Probe) }),
  );

describe("the theme before hydration", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is the one boot.js put on the page, so a dark page paints no light frame", () => {
    vi.stubGlobal("document", { documentElement: { dataset: { theme: "dark" } } });
    expect(firstRender()).toBe("<span>dark</span>");
  });

  it("is light on a light page", () => {
    vi.stubGlobal("document", { documentElement: { dataset: { theme: "light" } } });
    expect(firstRender()).toBe("<span>light</span>");
  });

  it("is light at build time, where there is no page", () => {
    expect(typeof document).toBe("undefined");
    expect(firstRender()).toBe("<span>light</span>");
  });
});
