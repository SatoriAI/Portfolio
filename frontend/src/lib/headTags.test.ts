import { describe, expect, it } from "vitest";

import { applyHeadTags, pageHeadTags } from "./headTags";

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
      const [, tag, name, value] = /^(\w+)\[([\w:]+)="([^"]+)"\]$/.exec(selector)!;
      return children.find((el) => el.tagName === tag && el.getAttribute(name) === value) ?? null;
    },
    append: (...elements: FakeElement[]) => void children.push(...elements),
  };
  for (const { tag, ...attributes } of tags) {
    const element = new FakeElement(tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    children.push(element);
  }
  const document = { head, createElement: (tag: string) => new FakeElement(tag) };
  const read = (tag: string, key: string, value: string, attribute: string) =>
    head.querySelector(`${tag}[${key}="${value}"]`)?.getAttribute(attribute) ?? null;
  return {
    document: document as unknown as Document,
    canonical: () => read("link", "rel", "canonical", "href"),
    ogUrl: () => read("meta", "property", "og:url", "content"),
    description: () => read("meta", "name", "description", "content"),
  };
};

const home: Record<string, string>[] = [
  { tag: "meta", name: "description", content: "Home" },
  { tag: "link", rel: "canonical", href: "https://www.dawidhanrahan.com/" },
  { tag: "meta", property: "og:url", content: "https://www.dawidhanrahan.com/" },
];
const page = { title: "Research", description: "Heat kernels" };

describe("applyHeadTags", () => {
  it("sets a page's tags over index.html's and puts them back", () => {
    const head = fakeDocument(home);
    const restore = applyHeadTags(head.document, pageHeadTags(page, "/Research/"));
    expect(head.canonical()).toBe("https://www.dawidhanrahan.com/research");
    expect(head.ogUrl()).toBe("https://www.dawidhanrahan.com/research");
    expect(head.description()).toBe("Heat kernels");
    restore();
    expect(head.canonical()).toBe("https://www.dawidhanrahan.com/");
    expect(head.description()).toBe("Home");
  });

  it("creates the address tags after a landing on 404.html, which has none", () => {
    const head = fakeDocument(home.filter((tag) => tag.name));
    const restore = applyHeadTags(head.document, pageHeadTags(page, "/research"));
    expect(head.canonical()).toBe("https://www.dawidhanrahan.com/research");
    expect(head.ogUrl()).toBe("https://www.dawidhanrahan.com/research");
    restore();
    expect(head.canonical()).toBeNull();
  });

  it("takes the address tags out for a page without one, and back after", () => {
    const head = fakeDocument(home);
    const restore = applyHeadTags(
      head.document,
      pageHeadTags({ ...page, canonical: false }, "/nope"),
    );
    expect(head.canonical()).toBeNull();
    expect(head.ogUrl()).toBeNull();
    restore();
    expect(head.canonical()).toBe("https://www.dawidhanrahan.com/");
    expect(head.ogUrl()).toBe("https://www.dawidhanrahan.com/");
  });
});
