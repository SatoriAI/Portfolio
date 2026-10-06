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
  circlesHidden = false,
  labels,
  className,
}: RoleSidebarProps) => {
  const chosen = roles.find((role) => role.id === selectedId);
  return (
    <nav aria-label={labels.list} className={cn("flex items-center gap-4 md:block", className)}>
      {/* In the axis's row, so the first circle starts on the axis line. */}
      <p
        aria-hidden="true"
        className="hidden h-7 text-center font-mono text-meta uppercase tracking-widest text-iris md:block"
      >
        {labels.list}
      </p>
      <ol className="flex gap-4 md:flex-col md:items-center md:gap-5">
        {roles.map((role) => {
          const selected = role.id === selectedId;
          const highlighted = highlightedIds?.has(role.id) ?? false;
          return (
            <li key={role.id}>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${labels.show(role.company)}, ${role.period}`}
                title={role.company}
                data-sidebar-circle={role.id}
                data-timeline-circle={role.id}
                onClick={() => onToggle(role.id)}
                className={cn(
                  // 44px on a phone: the smallest comfortable touch target.
                  "block size-11 md:size-12",
                  circleControl,
                  circleState(selected, highlighted),
                  circlesHidden && "invisible",
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
