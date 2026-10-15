import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./apiClient";

afterEach(() => vi.unstubAllGlobals());

describe("apiClient.getList", () => {
  // A list is fetched once for both languages, so it must never carry the
  // reader's language; the site translates its labels (see lib/queries.ts).
  it("always asks for the backend's English, whatever the reader's language", async () => {
    const fetch = vi.fn(
      async (_url: string, _init: RequestInit) => new Response("[]", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("window", { location: { pathname: "/pl/education" } });

    await apiClient.getList("/api/university/schools/");

    const init = fetch.mock.calls[0][1];
    expect((init.headers as Record<string, string>)["Accept-Language"]).toBe("en");
  });
});

describe("apiFetch", () => {
  it("asks in the language the page's address names, whatever the browser prefers", async () => {
    const fetch = vi.fn(
      async (_url: string, _init: RequestInit) => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("navigator", { languages: ["en-GB"], language: "en-GB" });
    const language = async (pathname: string) => {
      vi.stubGlobal("window", { location: { pathname } });
      await apiClient.post("/api/chat/", {});
      return (fetch.mock.lastCall![1].headers as Record<string, string>)["Accept-Language"];
    };

    expect(await language("/pl/research")).toBe("pl");
    expect(await language("/research")).toBe("en");
  });
});
