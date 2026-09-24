import { useState } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ExternalLink } from "lucide-react";

import DomainGlyph, { domainFor } from "@/components/academic/DomainGlyph";
import { Button } from "@/components/ui/button";
import type { UiPublication } from "@/lib/publicationsService";
import { cn } from "@/lib/utils";

/**
 * The papers as a stack of files.
 *
 * Every paper is a sheet. The one that is open lies in front and answers
 * first what the work established, in two or three sentences, with the full
 * abstract behind a press; the others sit behind it, each a little narrower,
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

type PublicationStackLabels = {
  view: string;
  /** Accessible name of the stack. */
  stack: string;
  venue: string;
  year: string;
  established: string;
  showAbstract: string;
  hideAbstract: string;
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
};

const Sheet = ({ publication, labels, summary, activation }: SheetProps) => {
  const [abstractOpen, setAbstractOpen] = useState(false);
  const domain = domainFor(publication.title);
  const lead = summary ?? publication.summary;
  const abstract = summary ? publication.summary : "";

  return (
    <article className="grid gap-6 md:grid-cols-[96px_minmax(0,7fr)_minmax(0,3fr)] md:gap-10">
      {domain ? (
        <DomainGlyph
          key={activation}
          kind={domain}
          entrance={activation > 0 ? "mount" : "reveal"}
          className="h-24"
        />
      ) : (
        <span />
      )}
      <div>
        <h3 className="text-card-title-sm font-semibold md:text-card-title">{publication.title}</h3>
        {lead && (
          <>
            {summary && (
              <p className="mt-4 font-mono text-meta uppercase tracking-widest text-muted-foreground">
                {labels.established}
              </p>
            )}
            <p className="mt-2 max-w-[52ch] text-base text-foreground">{lead}</p>
          </>
        )}
        {abstract && (
          <>
            <Button
              variant="link"
              className="mt-3 h-auto text-sm font-medium"
              aria-expanded={abstractOpen}
              onClick={() => setAbstractOpen((value) => !value)}
            >
              {abstractOpen ? labels.hideAbstract : labels.showAbstract}
            </Button>
            {abstractOpen && (
              <p className="mt-3 max-w-[52ch] text-base text-muted-foreground">{abstract}</p>
            )}
          </>
        )}
      </div>
      <dl className="space-y-4 font-mono text-meta md:border-l md:border-border md:pl-8">
        <div>
          <dt className="uppercase tracking-widest text-muted-foreground">{labels.venue}</dt>
          <dd className="mt-1 text-foreground">{publication.journal}</dd>
        </div>
        {publication.year > 0 && (
          <div>
            <dt className="uppercase tracking-widest text-muted-foreground">{labels.year}</dt>
            <dd className="mt-1 text-foreground">{publication.year}</dd>
          </div>
        )}
        {publication.link && (
          <div className="pt-2">
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
          </div>
        )}
      </dl>
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
  if (count === 0) return null;

  // Depth 0 is the open sheet; the rest keep their published order behind it.
  const depthOf = new Map<string, number>();
  let depth = 1;
  for (const publication of publications) {
    const id = String(publication.id);
    depthOf.set(id, id === open ? 0 : depth++);
  }

  return (
    <TabsPrimitive.Root
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
              style={{
                left: d * INSET_PX,
                right: d * INSET_PX,
                height: TAB_PX,
                transform: `translateY(${(count - 1 - d) * TAB_PX}px)`,
                zIndex: count - d,
              }}
              className={cn(
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
              <span className="min-w-0 truncate font-mono text-meta sm:shrink-0">
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
            style={{ zIndex: count + 1 }}
            className="relative col-start-1 row-start-1 rounded-b-card border border-t-0 border-border bg-card p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible data-[state=active]:duration-400 data-[state=active]:ease-brand data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 motion-reduce:data-[state=active]:animate-none md:p-8"
          >
            <Sheet
              publication={publication}
              labels={labels}
              summary={summaries[publication.link]}
              activation={activations[String(publication.id)] ?? 0}
            />
          </TabsPrimitive.Content>
        ))}
      </div>
    </TabsPrimitive.Root>
  );
};

export default PublicationStack;
