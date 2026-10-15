import type { Language } from "./locale";
import type { PageHead } from "./pageMeta";

/**
 * One tag in the document head, found by its key attributes
 * (`link[rel="alternate"][hreflang="pl"]`), and the value it should carry,
 * or null for a tag the page must not have.
 */
export type HeadTag = {
  tag: "meta" | "link";
  key: Record<string, string>;
  attribute: string;
  value: string | null;
};

const OG_LOCALE: Record<Language, string> = { en: "en_GB", pl: "pl_PL" };
const HREFLANGS = ["en", "pl", "x-default"] as const;

/**
 * The head tags a page carries. Every key is always listed, a missing value
 * as null, so moving between pages within the app takes a previous page's
 * alternates away rather than leaving them behind.
 */
export const pageHeadTags = ({ language, description, title, canonical, alternates }: PageHead) => {
  const href = (hreflang: string) =>
    alternates.find((alternate) => alternate.hreflang === hreflang)?.href ?? null;
  const other = alternates.find(
    (alternate) => alternate.hreflang !== language && alternate.hreflang !== "x-default",
  );
  const meta = (key: Record<string, string>, value: string | null): HeadTag => ({
    tag: "meta",
    key,
    attribute: "content",
    value,
  });
  return [
    meta({ name: "description" }, description),
    meta({ property: "og:title" }, title),
    meta({ property: "og:description" }, description),
    meta({ property: "og:url" }, canonical),
    { tag: "link", key: { rel: "canonical" }, attribute: "href", value: canonical },
    meta({ property: "og:locale" }, canonical && OG_LOCALE[language]),
    meta({ property: "og:locale:alternate" }, other ? OG_LOCALE[other.hreflang as Language] : null),
    ...HREFLANGS.map(
      (hreflang): HeadTag => ({
        tag: "link",
        key: { rel: "alternate", hreflang },
        attribute: "href",
        value: href(hreflang),
      }),
    ),
  ] satisfies HeadTag[];
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The attributes written in one tag of an HTML source. */
const attributesOf = (source: string) =>
  Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, v]) => [name, v]));

/** A tag of the template, with the whitespace that sets it on its own line. */
const TAG = /\n[ \t]*<(meta|link)\b[^>]*>/g;

/**
 * index.html as the page `head` describes, for a reader or a crawler that
 * runs no script: its language, its title, and its head tags in place of
 * the template's own, written where the template's last one stood.
 * Everything else, the bundle's scripts and the JSON-LD among it, is kept.
 */
export const pageHtml = (template: string, head: PageHead) => {
  const tags = pageHeadTags(head);
  const owned = (source: string) => {
    const [, tag] = /^\s*<(\w+)/.exec(source)!;
    const attributes = attributesOf(source);
    return tags.some(
      (headTag) =>
        headTag.tag === tag &&
        Object.entries(headTag.key).every(([name, value]) => attributes[name] === value),
    );
  };
  const rendered = tags
    .filter((headTag) => headTag.value !== null)
    .map(({ tag, key, attribute, value }) => {
      const attributes = Object.entries({ ...key, [attribute]: value! })
        .map(([name, text]) => `${name}="${escapeHtml(text)}"`)
        .join(" ");
      return `\n    <${tag} ${attributes} />`;
    })
    .join("");

  const lang = `<html lang="${head.language}">`;
  const title = `<title>${escapeHtml(head.title)}</title>`;
  const found = [...template.matchAll(TAG)].filter(([source]) => owned(source)).length;
  let left = found;
  const html = template
    .replace(/<html lang="[^"]*">/, lang)
    .replace(/<title>[^<]*<\/title>/, title)
    .replace(TAG, (source) => {
      if (!owned(source)) return source;
      return --left === 0 ? rendered : "";
    });
  if (found === 0 || !html.includes(lang) || !html.includes(title)) {
    throw new Error("index.html lacks the html lang, title or head tags a page is written over");
  }
  return html;
};
