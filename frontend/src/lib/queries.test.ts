import { QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { queryStatus } from "@/components/feedback/queryStatus";

import { createQueryClient, seedLists } from "./queries";

const projects = [{ id: 1, title: "Sample Project", tags: ["Python"] }];
const snapshot = { fetchedAt: Date.UTC(2026, 9, 1), lists: { projects } };
const labels = { loading: "Loading", error: "Failed", retry: "Retry" };

/** A page reading the seeded list, as useQuery would: subscribed until `stop`. */
const mount = (client: ReturnType<typeof createQueryClient>, queryFn: () => Promise<unknown>) => {
  const observer = new QueryObserver(client, { queryKey: ["projects"], queryFn });
  const stop = observer.subscribe(() => {});
  return { observer, stop };
};

/** Until the query's fetch, if one started, has settled. */
const settled = (client: ReturnType<typeof createQueryClient>) =>
  vi.waitFor(() => expect(client.isFetching()).toBe(0));

describe("seedLists", () => {
  it("serves the build's list at once, then fetches it exactly once", async () => {
    const client = createQueryClient();
    seedLists(client, snapshot);
    const queryFn = vi.fn(async () => structuredClone(projects));

    const first = mount(client, queryFn);
    // The build's data from the first render, as the page was drawn with it.
    expect(first.observer.getCurrentResult().data).toBe(projects);
    await settled(client);
    expect(queryFn).toHaveBeenCalledOnce();
    // An equal answer keeps the very same data, so nothing redraws.
    expect(first.observer.getCurrentResult().data).toBe(projects);
    first.stop();

    // Fetched once: the page mounted again reads the cache.
    const second = mount(client, queryFn);
    await settled(client);
    expect(queryFn).toHaveBeenCalledOnce();
    second.stop();
  });

  it("keeps showing the build's list when fetching it again fails", async () => {
    const client = createQueryClient();
    seedLists(client, snapshot);
    const { observer, stop } = mount(client, async () => {
      throw new Error("API down");
    });
    // The one quiet retry (createQueryClient), then the failure.
    await vi.waitFor(() => expect(observer.getCurrentResult().isError).toBe(true), {
      timeout: 5000,
    });
    const result = observer.getCurrentResult();
    expect(result.data).toBe(projects);
    // Neither loading nor failed: the page renders its content.
    expect(queryStatus([result], labels)).toBeNull();
    stop();
  });
});
