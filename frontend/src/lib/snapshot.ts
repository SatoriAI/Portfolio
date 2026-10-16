import { endpoints } from "../config/endpoints";

/**
 * The backend's lists as the build fetched them, so a page's HTML carries
 * its projects, roles, publications and testimonials rather than a spinner.
 * scripts/prerender.mjs loads one snapshot for the whole build (every
 * translation comes in one answer, so it serves both languages), renders
 * each page with the lists that page reads (see preparePage), and writes
 * those same lists into the page as JSON, which the browser seeds its cache
 * from before taking the page over, so both renders draw the same content.
 * The whole snapshot is also published as /snapshot.json, which the next
 * build falls back on when the API does not answer.
 */

/** Each list by the name its query is keyed on (lib/queries.ts). */
export const LISTS = {
  projects: endpoints.work.projects.list,
  experiences: endpoints.work.experiences.list,
  skills: endpoints.work.skills.list,
  publications: endpoints.education.publications.list,
  schools: endpoints.education.schools.list,
  testimonials: endpoints.education.testimonials.list,
} as const;

export type ListName = keyof typeof LISTS;

const LIST_NAMES = Object.keys(LISTS) as ListName[];

export type Snapshot = {
  /** When the lists left the API, in milliseconds since the epoch. */
  fetchedAt: number;
  /** As the API answered them, every translation included. */
  lists: Partial<Record<ListName, unknown[]>>;
};

/** Where the build publishes the whole snapshot, from the site's root. */
export const SNAPSHOT_FILE = "snapshot.json";

/** The id of the element a page carries its lists in. */
const ELEMENT_ID = "api-snapshot";

/** How long the build waits for any one answer, so a hanging API cannot hang a deploy. */
export const TIMEOUT_MS = 10_000;

/** Every list there, each an array: our own API's shape, checked only as far as the pages rely on. */
const isComplete = (value: unknown): value is Snapshot => {
  const snapshot = value as Snapshot | null;
  return (
    typeof snapshot?.fetchedAt === "number" &&
    typeof snapshot.lists === "object" &&
    snapshot.lists !== null &&
    LIST_NAMES.every((name) => Array.isArray(snapshot.lists[name]))
  );
};

type Fetch = (url: string, init: RequestInit) => Promise<Response>;

const getJson = async (fetchJson: Fetch, url: string): Promise<unknown> => {
  // The lists as apiClient.getList asks for them: the same in either language.
  const response = await fetchJson(url, {
    headers: { Accept: "application/json", "Accept-Language": "en" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
};

type Log = Pick<Console, "log" | "warn">;

/**
 * The snapshot the build renders with: every list fresh from the API at
 * `apiBaseUrl`; failing that, the one the site at `previousSiteUrl` was
 * deployed with; failing that too, none, and the pages ship with their
 * API-backed sections loading, as before this snapshot existed. Never
 * throws: a deploy should not wait on the API being up.
 */
export const loadSnapshot = async ({
  apiBaseUrl,
  previousSiteUrl,
  fetch: fetchJson = fetch,
  now = Date.now,
  log = console,
}: {
  apiBaseUrl: string;
  previousSiteUrl: string;
  fetch?: Fetch;
  now?: () => number;
  log?: Log;
}): Promise<Snapshot | undefined> => {
  const base = apiBaseUrl.replace(/\/$/, "");
  const fetchedAt = now();
  try {
    const lists = await Promise.all(
      LIST_NAMES.map(async (name) => [name, await getJson(fetchJson, `${base}${LISTS[name]}`)]),
    );
    const snapshot = { fetchedAt, lists: Object.fromEntries(lists) };
    if (!isComplete(snapshot)) throw new Error("a list that is not a list");
    log.log(`snapshot: the API's lists, from ${base}`);
    return snapshot;
  } catch (error) {
    log.warn(`snapshot: WARNING: the API at ${base} failed (${String(error)})`);
  }

  const previous = `${previousSiteUrl.replace(/\/$/, "")}/${SNAPSHOT_FILE}`;
  try {
    const snapshot = await getJson(fetchJson, previous);
    if (!isComplete(snapshot)) throw new Error("not a whole snapshot");
    log.warn(
      `snapshot: WARNING: using the previous deploy's lists, from ${previous}, as the API ` +
        `gave them on ${new Date(snapshot.fetchedAt).toISOString()}`,
    );
    return snapshot;
  } catch (error) {
    log.warn(
      `snapshot: WARNING: no snapshot at all: ${previous} failed too (${String(error)}). ` +
        "Every page ships with its API-backed sections loading.",
    );
    return undefined;
  }
};

/** The lists of `snapshot` that a page reads, or nothing when it has none of them. */
export const pickLists = (
  snapshot: Snapshot | undefined,
  names: readonly ListName[],
): Snapshot | undefined => {
  const lists = Object.fromEntries(
    names.flatMap((name) => (snapshot?.lists[name] ? [[name, snapshot.lists[name]]] : [])),
  );
  return snapshot && Object.keys(lists).length > 0
    ? { fetchedAt: snapshot.fetchedAt, lists }
    : undefined;
};

/**
 * A page's lists as an element of its HTML: JSON, which no browser runs, so
 * the site's script policy has nothing to block. `<` is escaped so no text
 * in the data can close the element.
 */
export const snapshotElement = (snapshot: Snapshot) =>
  `<script type="application/json" id="${ELEMENT_ID}">${JSON.stringify(snapshot).replace(
    /</g,
    "\\u003c",
  )}</script>`;

/** The lists the page's HTML carries (see snapshotElement), if any. */
export const readSnapshot = (document: Document): Snapshot | undefined => {
  const text = document.getElementById(ELEMENT_ID)?.textContent;
  return text ? (JSON.parse(text) as Snapshot) : undefined;
};
