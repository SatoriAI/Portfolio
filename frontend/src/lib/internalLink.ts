import { stripLanguage } from "./locale";

/**
 * The path within the site a link points to, or null when it leaves the site.
 * Vex writes site links as paths ("/research", "/#projects"), but an answer
 * may also spell out the site's own address; both stay in the same tab, so
 * the chat stays open while the page behind it changes. The path comes
 * without a language prefix, for the router, whose basename adds the
 * reader's own: a link to /pl/research read on an English page opens
 * /research, and never /pl/pl/research on a Polish one.
 */
export const SITE_HOSTS = ["www.dawidhanrahan.com", "dawidhanrahan.com"];

export function internalPath(href: string | undefined, origin: string): string | null {
  if (!href) return null;
  // An anchor on this page.
  if (href.startsWith("#")) return href;
  // A path, but not a protocol-relative "//host".
  if (href.startsWith("/") && !href.startsWith("//")) return stripLanguage(href);
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const own = url.origin === origin || SITE_HOSTS.includes(url.hostname);
  if (!own || !/^https?:$/.test(url.protocol)) return null;
  return stripLanguage(`${url.pathname}${url.search}${url.hash}`);
}
