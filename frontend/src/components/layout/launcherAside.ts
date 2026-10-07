import { createContext, type RefObject, useContext, useEffect } from "react";

/**
 * Lets a page name the text the floating chat button should stand aside for
 * (see PageLayout), now that the layout is a route around the page rather
 * than a component the page renders.
 */
export const LauncherAsideContext = createContext<(target: RefObject<HTMLElement> | null) => void>(
  () => undefined,
);

/** The chat button stands aside while this element is at the foot of the screen. */
export function useLauncherAside(target: RefObject<HTMLElement>) {
  const setTarget = useContext(LauncherAsideContext);
  useEffect(() => {
    setTarget(target);
    return () => setTarget(null);
  }, [setTarget, target]);
}
