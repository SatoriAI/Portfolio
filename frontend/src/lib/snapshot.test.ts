import { describe, expect, it, vi } from "vitest";

import { LISTS, loadSnapshot, pickLists, readSnapshot, snapshotElement } from "./snapshot";

const API = "http://api.test";
const PREVIOUS = "https://previous.test";
const NOW = Date.UTC(2026, 9, 16);

/** Every list, one made-up item each, as the API would answer. */
const apiLists = Object.fromEntries(Object.keys(LISTS).map((name) => [name, [{ id: 1, name }]]));
const previousSnapshot = { fetchedAt: Date.UTC(2026, 8, 1), lists: apiLists };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** A fetch that answers each address from `routes`, and refuses any other. */
const fetchFrom = (routes: Record<string, () => Response>) =>
  vi.fn(async (url: string) => {
    const route = routes[url];
    if (!route) throw new TypeError(`fetch failed: ${url}`);
    return route();
  });

const apiUp = Object.fromEntries(
  Object.entries(LISTS).map(([name, path]) => [`${API}${path}`, () => json(apiLists[name])]),
);
const previousUp = { [`${PREVIOUS}/snapshot.json`]: () => json(previousSnapshot) };

const load = (fetch: ReturnType<typeof fetchFrom>) => {
  const log = { log: vi.fn(), warn: vi.fn() };
  const result = loadSnapshot({
    apiBaseUrl: `${API}/`,
    previousSiteUrl: PREVIOUS,
    fetch,
    now: () => NOW,
    log,
  });
  return { result, log };
};

describe("loadSnapshot", () => {
  it("takes every list from the API when it answers", async () => {
    const fetch = fetchFrom({ ...apiUp, ...previousUp });
    const { result, log } = load(fetch);
    expect(await result).toEqual({ fetchedAt: NOW, lists: apiLists });
    expect(log.warn).not.toHaveBeenCalled();
    // Never asks the previous deploy, and asks the API for the lists in English, each with a timeout.
    expect(fetch).toHaveBeenCalledTimes(Object.keys(LISTS).length);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toMatchObject({ "Accept-Language": "en" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back on the previous deploy's snapshot when the API is down, and warns", async () => {
    const { result, log } = load(fetchFrom(previousUp));
    expect(await result).toEqual(previousSnapshot);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining(`${PREVIOUS}/snapshot.json`));
  });

  it("falls back as well when a list is not a list, or one list fails", async () => {
    const malformed = { ...apiUp, [`${API}${LISTS.skills}`]: () => json({ detail: "oops" }) };
    expect(await load(fetchFrom({ ...malformed, ...previousUp })).result).toEqual(previousSnapshot);
    const failing = { ...apiUp, [`${API}${LISTS.schools}`]: () => json("", 502) };
    expect(await load(fetchFrom({ ...failing, ...previousUp })).result).toEqual(previousSnapshot);
  });

  it("gives none, without throwing, when both are down, and says so loudly", async () => {
    const { result, log } = load(fetchFrom({}));
    expect(await result).toBeUndefined();
    expect(log.warn).toHaveBeenLastCalledWith(expect.stringContaining("no snapshot at all"));
  });

  it("refuses a previous snapshot that lacks a list", async () => {
    const { lists, ...rest } = previousSnapshot;
    const partial = { ...rest, lists: { ...lists, projects: undefined } };
    const { result } = load(fetchFrom({ [`${PREVIOUS}/snapshot.json`]: () => json(partial) }));
    expect(await result).toBeUndefined();
  });
});

describe("pickLists", () => {
  const snapshot = { fetchedAt: NOW, lists: apiLists };

  it("keeps the lists a page reads, and when they were fetched", () => {
    expect(pickLists(snapshot, ["projects", "skills"])).toEqual({
      fetchedAt: NOW,
      lists: { projects: apiLists.projects, skills: apiLists.skills },
    });
  });

  it("gives nothing to a page that reads no list, or without a snapshot", () => {
    expect(pickLists(snapshot, [])).toBeUndefined();
    expect(pickLists(undefined, ["projects"])).toBeUndefined();
  });
});

describe("snapshotElement", () => {
  it("cannot be closed early by the data, and reads back as written", () => {
    const snapshot = { fetchedAt: NOW, lists: { projects: [{ title: "</script><b>x" }] } };
    const element = snapshotElement(snapshot);
    expect(element.match(/<\/script>/g)).toHaveLength(1);
    const text = /^<script type="application\/json" id="api-snapshot">(.*)<\/script>$/.exec(
      element,
    )?.[1];
    const document = { getElementById: () => ({ textContent: text }) } as unknown as Document;
    expect(readSnapshot(document)).toEqual(snapshot);
  });
});
