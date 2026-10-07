import { useCallback, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import type { TimelineId } from "@/lib/timeline";

/**
 * Which timeline entry is chosen, and whether its dialog is open, played in
 * the order the visitor can follow: choosing draws the entry's line, and as
 * the line reaches its end the dialog grows out of the circle; closing is
 * the same backwards, the dialog shrinking into the circle and then the line
 * drawing back, so the timeline only changes while it can be seen and is
 * left as the visitor found it.
 *
 * The open entry is in the address as `#slug`, replaced rather than pushed so
 * Back leaves the page, and a link with a slug opens that entry once the
 * entries have loaded. The link is read whenever `entries` changes, so pass
 * a memoised list, not one built afresh on every render.
 */

/**
 * How long the line draws before the dialog starts to grow over it: long
 * enough to be seen reaching its end, which the brand easing does early in
 * the line's 500 ms.
 */
const LINE_LEAD_MS = 300;

const setHash = (hash: string) =>
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}${hash}`,
  );

export function useTimelineSelection<Id extends TimelineId>(
  entries: readonly { id: Id; slug: string }[],
) {
  const [selectedId, setSelectedId] = useState<Id | null>(null);
  const [open, setOpen] = useState(false);
  const opening = useRef<ReturnType<typeof setTimeout>>();
  const reducedMotion = usePrefersReducedMotion();

  // Draws the entry's line, then opens its dialog once the line has been
  // seen. While the dialog is already open it only swaps the entry.
  const openEntry = useCallback(
    (id: Id) => {
      setSelectedId(id);
      clearTimeout(opening.current);
      opening.current = setTimeout(() => setOpen(true), reducedMotion ? 0 : LINE_LEAD_MS);
    },
    [reducedMotion],
  );

  useEffect(() => () => clearTimeout(opening.current), []);

  useEffect(() => {
    const slug = window.location.hash.slice(1).toLowerCase();
    const linked = slug && entries.find((entry) => entry.slug === slug);
    if (linked) openEntry(linked.id);
  }, [entries, openEntry]);

  const select = (id: Id) => {
    openEntry(id);
    const entry = entries.find((candidate) => candidate.id === id);
    if (entry) setHash(`#${entry.slug}`);
  };

  // Called once the dialog has shrunk into its circle: the line follows it.
  const close = () => {
    setOpen(false);
    setSelectedId(null);
    setHash("");
  };

  return { selectedId, open, select, close };
}
