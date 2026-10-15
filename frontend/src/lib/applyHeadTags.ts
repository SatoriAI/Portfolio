import type { HeadTag } from "./headTags";

const selector = ({ tag, key }: HeadTag) =>
  tag +
  Object.entries(key)
    .map(([name, value]) => `[${name}="${value}"]`)
    .join("");

/**
 * Sets `tags` in the document head, creating a tag that is missing (a
 * reader who landed on 404.html has no canonical) and removing one whose
 * value is null. Returns what puts the head back as it was. Apart from
 * headTags.ts, which the build loads too, where there is no DOM.
 */
export const applyHeadTags = (document: Document, tags: readonly HeadTag[]) => {
  const undo = tags.map((headTag) => {
    const { tag, key, attribute, value } = headTag;
    const found = document.head.querySelector(selector(headTag));
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
    for (const [name, keyValue] of Object.entries(key)) created.setAttribute(name, keyValue);
    created.setAttribute(attribute, value);
    document.head.append(created);
    return () => created.remove();
  });
  return () => undo.reverse().forEach((step) => step());
};
