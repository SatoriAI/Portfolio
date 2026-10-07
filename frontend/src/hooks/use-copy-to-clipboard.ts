import { useCallback, useEffect, useState } from "react";

/**
 * Copies text and says so for a moment: `copied` is true for `resetMs` after
 * each successful copy, counted again from every copy. Where the clipboard
 * is unavailable or refuses, nothing claims a copy.
 */
export function useCopyToClipboard(resetMs: number) {
  // When the last copy happened; 0 while nothing is shown as copied.
  const [copiedAt, setCopiedAt] = useState(0);
  useEffect(() => {
    if (!copiedAt) return;
    const reset = window.setTimeout(() => setCopiedAt(0), resetMs);
    return () => window.clearTimeout(reset);
  }, [copiedAt, resetMs]);
  const copy = useCallback((text: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopiedAt(performance.now()),
      () => undefined,
    );
  }, []);
  return { copied: copiedAt !== 0, copy };
}
