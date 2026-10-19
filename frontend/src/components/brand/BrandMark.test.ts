import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TECH_ICONS, techIconId } from "@/config/techIcons";

import BrandMark, { BrandSprite } from "./BrandMark";

const { PostgreSQL, Python, Docker } = TECH_ICONS;

describe("techIconId", () => {
  it("names every mark apart", () => {
    const ids = Object.values(TECH_ICONS).map(techIconId);
    expect(ids.every((id) => id?.startsWith("brand-mark-"))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("BrandSprite", () => {
  it("writes each mark's path once, however often it is drawn", () => {
    const html = renderToString(
      createElement(BrandSprite, {
        icons: [PostgreSQL, Python, PostgreSQL, undefined],
        children: [PostgreSQL, PostgreSQL, Python].map((icon, key) =>
          createElement(BrandMark, { icon, key }),
        ),
      }),
    );
    expect(html.split(PostgreSQL.path)).toHaveLength(2);
    expect(html.match(/<symbol /g)).toHaveLength(2);
    expect(html.match(/<use href="#brand-mark-postgresql"/g)).toHaveLength(2);
    // The colour stays on each mark's own <svg>, for its reference to inherit.
    expect(html.match(new RegExp(`fill="${PostgreSQL.hex}"`, "g"))).toHaveLength(2);
    expect(html).not.toMatch(/<symbol[^>]*fill=|<path[^>]*fill=/);
  });

  it("leaves a mark it does not define written out", () => {
    const html = renderToString(
      createElement(BrandSprite, {
        icons: [Python],
        children: createElement(BrandMark, { icon: Docker }),
      }),
    );
    expect(html).toContain(Docker.path);
    expect(html).not.toContain("<use");
  });
});
