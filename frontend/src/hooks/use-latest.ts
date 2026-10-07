import { useLayoutEffect, useRef } from "react";

/**
 * A ref that always holds the latest value, for callbacks read by a listener
 * or a loop that should not restart when the callback changes. Updated after
 * render rather than during it, as concurrent rendering requires.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
