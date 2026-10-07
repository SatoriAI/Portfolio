import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useRef,
} from "react";

/**
 * Lets a page name the text the floating chat button should stand aside for
 * (see PageLayout), now that the layout is a route around the page rather
 * than a component the page renders.
 */
export const LauncherAsideContext = createContext<Dispatch<SetStateAction<HTMLElement | null>>>(
  () => undefined,
);

/**
 * A callback ref for the text the chat button stands aside for while it is
 * at the foot of the screen. The element itself reaches the layout, so text
 * that mounts later (after a page has shown "not found") is watched too.
 * Leaving clears only this element, never another page's.
 */
export function useLauncherAside() {
  const setTarget = useContext(LauncherAsideContext);
  const mine = useRef<HTMLElement | null>(null);
  return useCallback(
    (element: HTMLElement | null) => {
      const previous = mine.current;
      mine.current = element;
      setTarget((current) => element ?? (current === previous ? null : current));
    },
    [setTarget],
  );
}
