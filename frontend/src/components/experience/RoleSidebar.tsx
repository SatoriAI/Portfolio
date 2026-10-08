import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

import { circleControl, circleState } from "@/components/experience/circleStyles";
import CompanyMark from "@/components/experience/CompanyMark";
import { cn } from "@/lib/utils";

/**
 * The roles again, beside the skills: the same circles as on the timeline,
 * which on Experience fly here as the reader scrolls down to the skills.
 * Pressing one lights up the skills that role used (the page draws that),
 * and pressing it again lets go; with a role chosen, a link opens the role's
 * own entry. A column that stays in view from md, named like the layers
 * beside it; on a phone, a strip that stays under the header, the link at
 * its end.
 *
 * Each circle carries the entry's id twice: once for the flight to find where
 * it lands, and once for the role's dialog to grow out of it.
 */

type RoleSidebarProps = {
  roles: readonly { id: number; company: string; period: string }[];
  selectedId: number | null;
  onToggle: (id: number) => void;
  onOpen: (id: number) => void;
  /** Roles lit up from elsewhere on the page (a chosen skill's). */
  highlightedIds: ReadonlySet<number> | null;
  /** Read with each lit role, as its ring is only seen ("Docker used here"). */
  litNote?: string;
  /** Hidden while the circles fly in or back; they land here. */
  circlesHidden?: boolean;
  labels: {
    /** Names the list of roles, over the column from md. */
    list: string;
    /** "Nokia: show the skills", given the role's company. */
    show: (company: string) => string;
    open: string;
    /** "More about Nokia", given the role's company: the link's full name. */
    openFull: (company: string) => string;
  };
  className?: string;
};

const RoleSidebar = ({
  roles,
  selectedId,
  onToggle,
  onOpen,
  highlightedIds,
  litNote,
  circlesHidden = false,
  labels,
  className,
}: RoleSidebarProps) => {
  const chosen = roles.find((role) => role.id === selectedId);

  // On a phone the strip scrolls sideways: bring a chosen circle into it, or,
  // with none chosen, the first role a chosen skill lights, moving the strip
  // alone, never the page.
  // The strip is the circles' offset parent, so offsetLeft is measured in it.
  const strip = useRef<HTMLOListElement>(null);
  // Faded at its start too, once scrolled, so circles never end on a hard cut.
  const [scrolled, setScrolled] = useState(false);
  const firstLit = roles.find((role) => highlightedIds?.has(role.id))?.id ?? null;
  const shown = selectedId ?? firstLit;
  useEffect(() => {
    const list = strip.current;
    const circle = list?.querySelector<HTMLElement>(`[data-sidebar-circle="${shown}"]`);
    if (!list || !circle || list.scrollWidth <= list.clientWidth) return;
    const left = circle.offsetLeft;
    if (left < list.scrollLeft || left + circle.offsetWidth > list.scrollLeft + list.clientWidth)
      list.scrollTo({
        left: left - (list.clientWidth - circle.offsetWidth) / 2,
        behavior: "instant",
      });
  }, [shown]);
  return (
    <nav aria-label={labels.list} className={cn("flex items-center gap-4 md:block", className)}>
      {/* In the axis's row, so the first circle starts on the axis line. */}
      <p
        aria-hidden="true"
        className="hidden h-7 text-center font-mono text-meta uppercase tracking-widest text-iris md:block"
      >
        {labels.list}
      </p>
      {/* 24px apart, so the chosen circle's halo clears its neighbours. On a
          phone the strip is wider than the screen, so it scrolls sideways,
          with room round it for the halo. It fades at its end, and at its
          start once scrolled; the last circle, and any circle focused from
          the keyboard, stops clear of the fade. */}
      <ol
        ref={strip}
        onScroll={(event) => setScrolled(event.currentTarget.scrollLeft > 0)}
        style={{ "--strip-start": scrolled ? "transparent" : "black" } as CSSProperties}
        className="group/circles relative -my-4 -ml-4 flex min-w-0 scroll-px-6 gap-6 overflow-x-auto py-4 pl-4 pr-6 [mask-image:linear-gradient(to_right,var(--strip-start),black_24px,black_calc(100%-24px),transparent)] [scrollbar-width:none] md:m-0 md:flex-col md:items-center md:overflow-visible md:p-0 md:[mask-image:none]"
      >
        {roles.map((role) => {
          const selected = role.id === selectedId;
          const highlighted = highlightedIds?.has(role.id) ?? false;
          return (
            <li key={role.id}>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={[`${labels.show(role.company)}, ${role.period}`, highlighted && litNote]
                  .filter(Boolean)
                  .join(", ")}
                title={role.company}
                data-sidebar-circle={role.id}
                data-timeline-circle={role.id}
                onClick={() => onToggle(role.id)}
                className={cn(
                  // 44px on a phone: the smallest comfortable touch target.
                  "block size-11 md:size-12",
                  circleControl,
                  circleState(selected, {
                    receded: highlightedIds !== null && !highlighted,
                  }),
                  // Faded rather than hidden while the circles are in flight,
                  // so the keyboard can still reach them; focus brings them back.
                  // At once, not faded in, so a landing copy hands over cleanly.
                  "motion-safe:transition-transform",
                  circlesHidden &&
                    "pointer-events-none opacity-0 group-focus-within/circles:pointer-events-auto group-focus-within/circles:opacity-100",
                )}
              >
                <CompanyMark
                  company={role.company}
                  className="size-full text-xs ring-0 md:text-sm"
                />
              </button>
            </li>
          );
        })}
      </ol>
      {chosen && (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={labels.openFull(chosen.company)}
          onClick={() => onOpen(chosen.id)}
          className="flex shrink-0 items-center gap-1 rounded-lg font-mono text-meta text-iris duration-200 animate-in fade-in-0 hover:text-foreground motion-reduce:animate-none md:mx-auto md:mt-4"
        >
          {labels.open}
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </nav>
  );
};

export default RoleSidebar;
