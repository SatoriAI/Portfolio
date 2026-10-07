import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * The text the floating chat button stands aside for (see PageLayout). A
 * page names it with useLauncherAside; the layout, which outlives its pages,
 * provides the register with useLauncherAsideTarget and watches the target.
 * The register replaces an element only with the one that held it, so a page
 * leaving never clears another's.
 */

type Register = (previous: HTMLElement | null, next: HTMLElement | null) => void;

const LauncherAsideContext = createContext<Register>(() => undefined);

/** Provides the register to the pages inside it. */
export const LauncherAsideProvider = LauncherAsideContext.Provider;

/** For the layout: the element to stand aside for, and the register to provide. */
export function useLauncherAsideTarget() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const register = useCallback<Register>(
    (previous, next) => setTarget((current) => next ?? (current === previous ? null : current)),
    [],
  );
  return { target, register };
}

/**
 * For a page: a callback ref for the text the chat button stands aside for
 * while it is at the foot of the screen. The element itself reaches the
 * layout, so text that mounts later (after "not found") is watched too.
 */
export function useLauncherAside() {
  const register = useContext(LauncherAsideContext);
  const mine = useRef<HTMLElement | null>(null);
  return useCallback(
    (element: HTMLElement | null) => {
      const previous = mine.current;
      mine.current = element;
      register(previous, element);
    },
    [register],
  );
}
