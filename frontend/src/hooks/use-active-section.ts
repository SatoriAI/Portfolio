import { useEffect, useState } from "react";

/**
 * Scroll-spy: returns the id of the section currently occupying the middle
 * band of the viewport. When the page is scrolled to the very bottom the last
 * section wins, since a short final section may never reach that band.
 * The sections are looked up again whenever `page` changes, since the
 * caller (the header) outlives the page that holds them.
 */
export function useActiveSection(ids: readonly string[], page: string) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const pickActive = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }
      const first = elements.find((el) => visible.has(el.id));
      setActiveId(first ? first.id : null);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        pickActive();
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", pickActive, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pickActive);
      setActiveId(null);
    };
  }, [ids, page]);

  return activeId;
}
