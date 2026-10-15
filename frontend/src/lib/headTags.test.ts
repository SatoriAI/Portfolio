import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

import { applyHeadTags } from "./applyHeadTags";
import { pageHeadTags, pageHtml } from "./headTags";
import type { PageHead } from "./pageMeta";

/** Just enough of a document head for applyHeadTags, without a DOM library. */
const fakeDocument = (tags: Record<string, string>[]) => {
  const children: FakeElement[] = [];
  class FakeElement {
    attributes = new Map<string, string>();
    constructor(readonly tagName: string) {}
    getAttribute = (name: string) => this.attributes.get(name) ?? null;
    setAttribute = (name: string, value: string) => void this.attributes.set(name, value);
    remove = () => void children.splice(children.indexOf(this), 1);
  }
  const head = {
    querySelector: (selector: string) => {
      const tag = /^\w+/.exec(selector)![0];
      const key = [...selector.matchAll(/\[([\w:-]+)="([^"]+)"\]/g)];
      return (
        children.find(
          (el) =>
            el.tagName === tag && key.every(([, name, value]) => el.getAttribute(name) === value),
        ) ?? null
      );
    },
    append: (...elements: FakeElement[]) => void children.push(...elements),
  };
  for (const { tag, ...attributes } of tags) {
    const element = new FakeElement(tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    children.push(element);
  }
  const document = { head, createElement: (tag: string) => new FakeElement(tag) };
  const read = (selector: string, attribute: string) =>
    head.querySelector(selector)?.getAttribute(attribute) ?? null;
  return {
    document: document as unknown as Document,
    canonical: () => read('link[rel="canonical"]', "href"),
    ogUrl: () => read('meta[property="og:url"]', "content"),
    description: () => read('meta[name="description"]', "content"),
    hreflang: (lang: string) => read(`link[rel="alternate"][hreflang="${lang}"]`, "href"),
  };
};

const SITE = "https://www.dawidhanrahan.com";
const home: Record<string, string>[] = [
  { tag: "meta", name: "description", content: "Home" },
  { tag: "link", rel: "canonical", href: `${SITE}/` },
  { tag: "meta", property: "og:url", content: `${SITE}/` },
];
const research: PageHead = {
  language: "pl",
  title: "Badania",
  description: "Jądra ciepła",
  canonical: `${SITE}/pl/research`,
  alternates: [
    { hreflang: "en", href: `${SITE}/research` },
    { hreflang: "pl", href: `${SITE}/pl/research` },
    { hreflang: "x-default", href: `${SITE}/research` },
  ],
};
const notFound: PageHead = { ...research, canonical: null, alternates: [] };

describe("pageHeadTags", () => {
  it("names the page's locale, the other one, and an alternate per language", () => {
    const value = (key: string) =>
      pageHeadTags(research).find((tag) => Object.values(tag.key).includes(key))?.value;
    expect(value("og:locale")).toBe("pl_PL");
    expect(value("og:locale:alternate")).toBe("en_GB");
    expect(value("x-default")).toBe(`${SITE}/research`);
  });

  it("lists every key without an address too, as null, so moving on takes them away", () => {
    const tags = pageHeadTags(notFound);
    expect(tags).toHaveLength(pageHeadTags(research).length);
    const gone = tags.filter((tag) => tag.value === null).map((tag) => Object.values(tag.key));
    expect(gone).toEqual([
      ["og:url"],
      ["canonical"],
      ["og:locale"],
      ["og:locale:alternate"],
      ["alternate", "en"],
      ["alternate", "pl"],
      ["alternate", "x-default"],
    ]);
  });
});

describe("applyHeadTags", () => {
  it("sets a page's tags over index.html's and puts them back", () => {
    const head = fakeDocument(home);
    const restore = applyHeadTags(head.document, pageHeadTags(research));
    expect(head.canonical()).toBe(`${SITE}/pl/research`);
    expect(head.ogUrl()).toBe(`${SITE}/pl/research`);
    expect(head.description()).toBe("Jądra ciepła");
    expect(head.hreflang("en")).toBe(`${SITE}/research`);
    expect(head.hreflang("pl")).toBe(`${SITE}/pl/research`);
    restore();
    expect(head.canonical()).toBe(`${SITE}/`);
    expect(head.description()).toBe("Home");
    expect(head.hreflang("en")).toBeNull();
  });

  it("creates the address tags after a landing on 404.html, which has none", () => {
    const head = fakeDocument(home.filter((tag) => tag.name));
    const restore = applyHeadTags(head.document, pageHeadTags(research));
    expect(head.canonical()).toBe(`${SITE}/pl/research`);
    expect(head.ogUrl()).toBe(`${SITE}/pl/research`);
    restore();
    expect(head.canonical()).toBeNull();
  });

  it("takes the address tags out for a page without one, and back after", () => {
    const head = fakeDocument(home);
    const restore = applyHeadTags(head.document, pageHeadTags(notFound));
    expect(head.canonical()).toBeNull();
    expect(head.ogUrl()).toBeNull();
    restore();
    expect(head.canonical()).toBe(`${SITE}/`);
    expect(head.ogUrl()).toBe(`${SITE}/`);
  });
});

describe("pageHtml", () => {
  const template = readFileSync(
    fileURLToPath(new URL("../../index.html", import.meta.url)),
    "utf8",
  );
  const html = pageHtml(template, research);
  const count = (pattern: RegExp) => html.match(pattern)?.length ?? 0;

  it("writes the page's language, title and head tags over the template's, once each", () => {
    expect(html).toContain('<html lang="pl">');
    expect(html).toContain("<title>Badania</title>");
    expect(count(/<link rel="canonical"/g)).toBe(1);
    expect(html).toContain(`<link rel="canonical" href="${SITE}/pl/research" />`);
    expect(count(/<meta property="og:url"/g)).toBe(1);
    expect(count(/name="description"/g)).toBe(1);
    expect(count(/<link rel="alternate" hreflang=/g)).toBe(3);
    expect(html).toContain('<meta property="og:locale" content="pl_PL" />');
  });

  it("keeps everything else: the icons, the image, the JSON-LD and the app's script", () => {
    expect(html).toContain('property="og:image"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
  });

  it("escapes what it writes", () => {
    const page = pageHtml(template, { ...research, title: 'A <b> & "c"' });
    expect(page).toContain("<title>A &lt;b&gt; &amp; &quot;c&quot;</title>");
    expect(page).toContain('content="A &lt;b&gt; &amp; &quot;c&quot;"');
  });

  it("refuses a template without the tags it writes over", () => {
    expect(() => pageHtml("<html><head></head></html>", research)).toThrow();
  });
});
