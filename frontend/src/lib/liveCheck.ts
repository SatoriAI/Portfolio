/**
 * "Sprawdź na żywo": whether a project's address answers right now, asked
 * from the reader's own browser, and how long the answer took.
 *
 * The request is `no-cors`: the browser lets a page reach another site that
 * way but hides the response, so the page cannot see a status code, only
 * that something came back. "Answered" means exactly that: the host replied
 * over the network within the time limit. A refused connection, a DNS
 * failure or the limit running out is "no answer". The time includes the
 * reader's own network, which is why the page says whose browser asked.
 */

export type CheckResult = { answered: true; ms: number } | { answered: false };

/** Where one address's check is: not asked yet, under way, or answered. */
export type CheckState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "done"; result: CheckResult };

/** How long a check waits before it calls the address silent. */
export const CHECK_TIMEOUT_MS = 8000;

type CheckOptions = {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

export async function checkHost(
  url: string,
  {
    timeoutMs = CHECK_TIMEOUT_MS,
    fetchImpl = fetch,
    now = () => performance.now(),
  }: CheckOptions = {},
): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = now();
  try {
    await fetchImpl(url, {
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    return { answered: true, ms: Math.max(1, Math.round(now() - start)) };
  } catch {
    return { answered: false };
  } finally {
    clearTimeout(timer);
  }
}

/** A project's address as the reader would type it: "picko.world". */
export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
