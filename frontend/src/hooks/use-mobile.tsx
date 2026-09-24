import * as React from "react";

const MOBILE_QUERY = "(max-width: 767px)";

/**
 * True below Tailwind's `md` breakpoint. Initialised synchronously so the
 * first render already matches the viewport; this is a client-only app.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(MOBILE_QUERY).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    onChange();
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
