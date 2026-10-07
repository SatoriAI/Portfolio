import { useLayoutEffect, useRef, useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ExternalLink } from "lucide-react";

import DomainGlyph, { domainFor } from "@/components/academic/DomainGlyph";
import { Button } from "@/components/ui/button";
import { publicationDetails, type PublicationStatus } from "@/config/publications";
import { useOnceInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { EASE_BRAND } from "@/lib/motion";
import type { UiPublication } from "@/lib/publicationsService";
import { cn } from "@/lib/utils";

/**
 * The papers as a stack of files.
 *
 * Every paper is a sheet. The one that is open lies in front and says what
 * the work established, in two or three sentences, with the link to the paper
 * under its glyph; the others sit behind it, each a little narrower,
 * with only a tab showing — the domain glyph, venue, year and title — the way
 * folders sit in a drawer. Pressing a tab brings that sheet to the front over
 * the kit's 400ms and sends the open one back. The tabs are real tabs (roving
 * focus, arrow keys) so the stack reads correctly to a keyboard and a screen
 * reader.
 *
 * The stack is built from two measures: the tab height (44px, the kit's
 * minimum control) and the inset each sheet behind loses on both sides. Every
 * sheet stays mounted on one grid cell, so the stack is as tall as its tallest
 * paper and the page does not shift when a different one opens; with the
 * abstracts folded the sheets are close to one height anyway.
 */

const TAB_PX = 44;
const INSET_PX = 16;

/**
 * The stack is filed once, the first time it is seen: the sheets are laid on
 * the pile from the back, each a moment after the last, falling the height
 * of a tab and settling; the open one comes last, and then its stamp comes
 * down on it. Individual `translate` and `scale`, not `transform`, so the
 * tabs keep their own place in the pile and the stamp its tilt. Once, and
 * not under reduced motion.
 */
const FILE_DROP_PX = 40;
const FILE_MS = 460;
const FILE_STAGGER_MS = 160;
const STAMP_MS = 380;

type PublicationStackLabels = {
  view: string;
  /** Accessible name of the stack. */
  stack: string;
  established: string;
  /** Label before the names: one author, or several. */
  author: string;
  authors: string;
  /** The words on the stamp in the sheet's corner. */
  status: Record<PublicationStatus, string>;
};

type PublicationStackProps = {
  publications: readonly UiPublication[];
  labels: PublicationStackLabels;
  /** What each paper established, keyed by its link. A paper without one shows its abstract. */
  summaries?: Record<string, string>;
  className?: string;
};

type SheetProps = {
  publication: UiPublication;
  labels: PublicationStackLabels;
  summary?: string;
  /**
   * Counts the selections that opened this sheet. Zero is the initial open,
   * whose glyph draws when the stack scrolls into view; each later selection
   * remounts the glyph so it draws again as the sheet comes forward.
   */
  activation: number;
  /** Holds the glyph's drawing back until the sheet has landed. */
  glyphDelayMs?: number;
};

const stampClassName: Record<PublicationStatus, string> = {
  published: "border-published text-published",
  preprint: "border-preprint text-preprint",
};

/**
 * A rubber stamp in the sheet's top-right corner: green for a paper published
 * in a journal, blue for a preprint. Tilted down to the right, as a stamp lands; the
 * word on it says the same as the colour.
 */
const Stamp = ({ status, label }: { status: PublicationStatus; label: string }) => (
  <p
    data-stamp
    className={cn(
      "pointer-events-none absolute right-5 top-3 rotate-6 select-none rounded-md border-2 px-2.5 py-1 font-mono text-meta font-semibold uppercase tracking-widest md:right-8 md:top-4",
      stampClassName[status],
    )}
  >
    {label}
  </p>
);

const Sheet = ({ publication, labels, summary, activation, glyphDelayMs = 0 }: SheetProps) => {
  const domain = domainFor(publication.title);
  const lead = summary ?? publication.summary;
  const details = publicationDetails[publication.link];
  const authors = details?.authors ?? [];

  return (
    <article className="grid gap-6 md:grid-cols-[96px_minmax(0,1fr)] md:gap-10">
      {details && <Stamp status={details.status} label={labels.status[details.status]} />}
      {/* The glyph, and under it the way to the paper. Venue and year are on
          the tab above, so the sheet does not repeat them. */}
      <div className="flex w-fit flex-col items-center gap-4">
        {domain ? (
          <DomainGlyph
            key={activation}
            kind={domain}
            entrance={activation > 0 ? "mount" : "reveal"}
            delayMs={activation > 0 ? 0 : glyphDelayMs}
            className="h-24"
          />
        ) : (
          <span />
        )}
        {publication.link && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={publication.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${labels.view} — ${publication.title}`}
            >
              <ExternalLink />
              {labels.view}
            </a>
          </Button>
        )}
      </div>
      <div>
        {/* From md the stamp sits beside the title, so the title leaves it
            room; on a phone the stamp sits beside the glyph instead. */}
        <h3
          className={cn(
            "text-card-title-sm font-semibold md:text-card-title",
            details && "md:pr-44",
          )}
        >
          {publication.title}
        </h3>
        {authors.length > 0 && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-meta uppercase tracking-widest text-muted-foreground">
              {authors.length > 1 ? labels.authors : labels.author}
            </span>
            <span className="text-base text-foreground">{authors.join(", ")}</span>
          </p>
        )}
        {lead && (
          <>
            {summary && (
              <p className="mt-4 font-mono text-meta uppercase tracking-widest text-muted-foreground">
                {labels.established}
              </p>
            )}
            <p className="mt-2 text-base text-foreground">{lead}</p>
          </>
        )}
      </div>
    </article>
  );
};

const PublicationStack = ({
  publications,
  labels,
  summaries = {},
  className,
}: PublicationStackProps) => {
  const [openId, setOpenId] = useState(() => String(publications[0]?.id ?? ""));
  // How many times each sheet has been selected since the page loaded.
  const [activations, setActivations] = useState<Record<string, number>>({});
  const select = (id: string) => {
    setOpenId(id);
    setActivations((previous) => ({ ...previous, [id]: (previous[id] ?? 0) + 1 }));
  };
  const open = publications.some((p) => String(p.id) === openId)
    ? openId
    : String(publications[0]?.id ?? "");
  const count = publications.length;

  const root = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  // Hidden until seen, then filed, then at rest.
  const [filing, setFiling] = useState<"waiting" | "filing" | "filed">(
    prefersReducedMotion ? "filed" : "waiting",
  );

  useOnceInView(root, () => setFiling("filing"), {
    threshold: 0.3,
    enabled: filing === "waiting",
  });

  // Already on screen when the page opens (a link to #publications, say):
  // shown as it is, before the first paint, rather than hidden and filed.
  useLayoutEffect(() => {
    const element = root.current;
    if (element && element.getBoundingClientRect().top < window.innerHeight) {
      setFiling((now) => (now === "waiting" ? "filed" : now));
    }
  }, []);

  // Before the first paint of the filing, so nothing shows in place and then
  // jumps away.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || filing !== "filing") return;
    const drop = [
      { translate: `0 ${-FILE_DROP_PX}px`, opacity: 0 },
      { translate: "0 0", opacity: 1 },
    ];
    const timing = (order: number) => ({
      duration: FILE_MS,
      delay: order * FILE_STAGGER_MS,
      easing: EASE_BRAND,
      fill: "backwards" as const,
    });
    // The back of the pile first, the open sheet (its tab and its body) last.
    const tabs = [...element.querySelectorAll<HTMLElement>("[data-file-depth]")];
    const deepest = Math.max(0, ...tabs.map((tab) => Number(tab.dataset.fileDepth)));
    const animations = tabs.map((tab) =>
      tab.animate(drop, timing(deepest - Number(tab.dataset.fileDepth))),
    );
    const body = element.querySelector<HTMLElement>("[data-state=active][data-file-body]");
    if (body) animations.push(body.animate(drop, timing(deepest)));
    // Then the stamp, pressed down on the open sheet.
    const stamp = body?.querySelector<HTMLElement>("[data-stamp]");
    if (stamp) {
      animations.push(
        stamp.animate(
          [
            { scale: "1.6", opacity: 0 },
            { scale: "0.94", opacity: 1, offset: 0.7 },
            { scale: "1", opacity: 1 },
          ],
          {
            duration: STAMP_MS,
            delay: deepest * FILE_STAGGER_MS + FILE_MS,
            easing: "cubic-bezier(0.3, 0, 0.3, 1)",
            fill: "backwards",
          },
        ),
      );
    }
    const last = animations[animations.length - 1];
    if (last) last.onfinish = () => setFiling("filed");
    return () => animations.forEach((animation) => animation.cancel());
  }, [filing]);

  if (count === 0) return null;
  // While waiting, the stack is laid out but not shown, so the page does not
  // shift when it is filed; on paper it is always shown.
  const waiting = filing === "waiting";
  const hiddenUntilFiled = waiting && "opacity-0 print:opacity-100";

  // Depth 0 is the open sheet; the rest keep their published order behind it.
  const depthOf = new Map<string, number>();
  let depth = 1;
  for (const publication of publications) {
    const id = String(publication.id);
    depthOf.set(id, id === open ? 0 : depth++);
  }

  return (
    <TabsPrimitive.Root
      ref={root}
      value={open}
      onValueChange={select}
      orientation="horizontal"
      className={cn("relative", className)}
      style={{ paddingTop: (count - 1) * TAB_PX }}
    >
      <TabsPrimitive.List aria-label={labels.stack} className="contents">
        {publications.map((publication) => {
          const id = String(publication.id);
          const d = depthOf.get(id) ?? 0;
          const isOpen = d === 0;
          const domain = domainFor(publication.title);
          return (
            <TabsPrimitive.Trigger
              key={id}
              value={id}
              data-file-depth={d}
              style={{
                left: d * INSET_PX,
                right: d * INSET_PX,
                height: TAB_PX,
                transform: `translateY(${(count - 1 - d) * TAB_PX}px)`,
                zIndex: count - d,
              }}
              className={cn(
                hiddenUntilFiled,
                "absolute top-0 flex items-center gap-3 rounded-t-card border border-border bg-card px-5 text-left outline-none",
                "transition-[transform,left,right,color,border-color,box-shadow] duration-400 ease-brand motion-reduce:transition-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background",
                isOpen
                  ? "border-b-transparent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:shadow-lift",
              )}
            >
              {/* The two titles differ by one word; the domain, drawn small,
                  tells them apart before anyone reads. */}
              {domain ? (
                <DomainGlyph kind={domain} className="h-6 shrink-0" />
              ) : (
                <span
                  aria-hidden="true"
                  className="block h-2 w-2 shrink-0 rounded-motif bg-primary"
                />
              )}
              {/* On a phone the tab holds only the venue and year; the title
                  would not fit and is a press away. */}
              {/* On a phone the year leads, so a long venue loses its end
                  rather than the year. */}
              <span className="min-w-0 truncate font-mono text-meta sm:hidden">
                {publication.year ? `${publication.year} · ` : ""}
                {publication.journal}
              </span>
              <span className="hidden min-w-0 truncate font-mono text-meta sm:inline sm:shrink-0">
                {publication.journal}
                {publication.year ? ` · ${publication.year}` : ""}
              </span>
              <span className="hidden min-w-0 truncate text-sm font-medium sm:block">
                {publication.title}
              </span>
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>

      <div className="grid" style={{ marginTop: TAB_PX }}>
        {publications.map((publication) => (
          <TabsPrimitive.Content
            key={publication.id}
            value={String(publication.id)}
            forceMount
            data-file-body
            style={{ zIndex: count + 1 }}
            className={cn(
              hiddenUntilFiled,
              "relative col-start-1 row-start-1 rounded-b-card border border-t-0 border-border bg-card p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible data-[state=active]:duration-400 data-[state=active]:ease-brand data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 motion-reduce:data-[state=active]:animate-none md:p-8",
            )}
          >
            <Sheet
              publication={publication}
              labels={labels}
              summary={summaries[publication.link]}
              activation={activations[String(publication.id)] ?? 0}
              // While the stack is filed, the drawing waits for the sheet to
              // land and the stamp to come down: one move after another.
              glyphDelayMs={
                filing === "filed" ? 0 : (count - 1) * FILE_STAGGER_MS + FILE_MS + STAMP_MS
              }
            />
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  );
};

export default PublicationStack;
