import { absoluteUrl } from "./siteMap";

/**
 * One tag in the document head, found by its key attribute
 * (`meta[name="description"]`), and the value it should carry, or null for
 * a tag the page must not have.
 */
export type HeadTag = {
  tag: "meta" | "link";
  key: [attribute: string, value: string];
  attribute: string;
  value: string | null;
};

export type PageMeta = {
  title: string;
  description: string;
  /** False for a page with no address of its own, such as not-found. */
  canonical?: boolean;
};

/** The head tags a page at `pathname` carries, over the defaults in index.html. */
export const pageHeadTags = (
  { title, description, canonical = true }: PageMeta,
  pathname: string,
): HeadTag[] => {
  const url = canonical ? absoluteUrl(pathname) : null;
  return [
    { tag: "meta", key: ["name", "description"], attribute: "content", value: description },
    { tag: "meta", key: ["property", "og:title"], attribute: "content", value: title },
    { tag: "meta", key: ["property", "og:description"], attribute: "content", value: description },
    { tag: "meta", key: ["property", "og:url"], attribute: "content", value: url },
    { tag: "link", key: ["rel", "canonical"], attribute: "href", value: url },
  ];
};

/**
 * Sets `tags` in the document head, creating a tag that is missing (a
 * reader who landed on 404.html has no canonical) and removing one whose
 * value is null. Returns what puts the head back as it was.
 */
export const applyHeadTags = (document: Document, tags: readonly HeadTag[]) => {
  const undo = tags.map(({ tag, key: [keyName, keyValue], attribute, value }) => {
    const found = document.head.querySelector(`${tag}[${keyName}="${keyValue}"]`);
    if (value === null) {
      found?.remove();
      return () => found && document.head.append(found);
    }
    if (found) {
      const previous = found.getAttribute(attribute) ?? "";
      found.setAttribute(attribute, value);
      return () => found.setAttribute(attribute, previous);
    }
    const created = document.createElement(tag);
    created.setAttribute(keyName, keyValue);
    created.setAttribute(attribute, value);
    document.head.append(created);
    return () => created.remove();
  });
  return () => undo.reverse().forEach((step) => step());
};
