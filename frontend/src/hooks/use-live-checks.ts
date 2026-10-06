import { useCallback, useEffect, useRef, useState } from "react";

import type { CheckState } from "@/components/home/LiveCheck";
import { checkHost } from "@/lib/liveCheck";

/**
 * The live checks of the projects' addresses, kept by address so the panel
 * and the index read the same result. `checkAll` asks one address after
 * another, never all at once, so each time is its own and the reader can
 * watch them come in.
 */
export function useLiveChecks() {
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  // Set in the effect, not only cleared in its cleanup: React may run the
  // effect again on the same component (Strict Mode, a hot reload).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const check = useCallback(async (url: string) => {
    setChecks((all) => ({ ...all, [url]: { phase: "checking" } }));
    const result = await checkHost(url);
    if (mounted.current) setChecks((all) => ({ ...all, [url]: { phase: "done", result } }));
  }, []);

  const checkAll = useCallback(
    async (urls: readonly string[]) => {
      for (const url of urls) {
        if (!mounted.current) return;
        await check(url);
      }
    },
    [check],
  );

  // The first sight of the results, from wherever the reader meets them
  // first (the sentence under the heading or the strip), starts them once.
  const startedAll = useRef(false);
  const checkAllOnce = useCallback(
    (urls: readonly string[]) => {
      if (startedAll.current || urls.length === 0) return;
      startedAll.current = true;
      void checkAll(urls);
    },
    [checkAll],
  );

  const stateOf = (url: string): CheckState => checks[url] ?? { phase: "idle" };

  return { stateOf, check, checkAll, checkAllOnce };
}

export type LiveChecks = ReturnType<typeof useLiveChecks>;
