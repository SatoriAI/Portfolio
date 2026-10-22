import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "fs";
import { Brain, Code, Infinity as InfinityIcon, Network } from "lucide-react";
import { describe, expect, it } from "vitest";

import { TECH_ICONS } from "@/config/techIcons";

import { skillIcon } from "./skillIcon";

/**
 * Every choice of work.choices.Icons, read from the backend's own file so
 * the two cannot drift apart unnoticed: a choice the frontend cannot draw
 * fails here rather than showing as Code on the live page.
 */
const CHOICES = [
  ...readFileSync(
    new URL("../../../backend/portfolio/work/choices.py", import.meta.url),
    "utf8",
  ).matchAll(/^ {4}[A-Z_]+ = "([^"]+)", "[^"]+"$/gm),
].map((match) => match[1]);
const isBrand = (name: string): name is keyof typeof TECH_ICONS => name in TECH_ICONS;

describe("skillIcon", () => {
  it("reads the backend's choices", () => {
    expect(CHOICES).toEqual(expect.arrayContaining(["Code", "Network", "Python", "Go"]));
  });

  it("draws every outline choice with its own Lucide icon", () => {
    for (const name of CHOICES.filter((name) => !isBrand(name) && name !== "Code")) {
      expect(skillIcon(name), name).not.toBe(Code);
    }
    expect(skillIcon("Brain")).toBe(Brain);
    expect(skillIcon("Network")).toBe(Network);
    expect(skillIcon("Infinity")).toBe(InfinityIcon);
  });

  it("draws every brand choice with that brand's mark", () => {
    const brands = CHOICES.filter(isBrand);
    expect(brands).toEqual(expect.arrayContaining(["Python", "Go", "Claude"]));
    for (const name of brands) {
      const markup = renderToStaticMarkup(createElement(skillIcon(name)));
      expect(markup, name).toContain(TECH_ICONS[name].path);
      expect(markup, name).toContain(`fill="${TECH_ICONS[name].hex}"`);
    }
  });

  it("returns the same component each time, so a re-render keeps the icon", () => {
    expect(skillIcon("Go")).toBe(skillIcon("Go"));
  });

  // The backend can gain a choice before the frontend does; it must not
  // draw nothing.
  it("falls back to Code for a name it does not know", () => {
    expect(skillIcon("Rocket")).toBe(Code);
    expect(skillIcon("toString")).toBe(Code);
  });
});
