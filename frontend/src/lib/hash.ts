/**
 * The address's `#slug`, which names the open item of a page (a role, a
 * degree), so a link can open it. Slugs are lower case, and a link's
 * capitals are forgiven.
 */
export const linkedSlug = () => window.location.hash.slice(1).toLowerCase();

/** Names the open item in the address, or clears it, without a history entry. */
export const replaceHash = (slug: string | null) =>
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}${slug ? `#${slug}` : ""}`,
  );
