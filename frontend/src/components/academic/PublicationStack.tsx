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
 * Every paper is a sheet. The one that is open lies in front, showing the
 * domain it works on, its venue and year, the title, the abstract and the
 * link; the others sit behind it, each a little narrower, with only its
 * tab showing — venue, year and title on one line — the way folders sit in a
 * drawer. Pressing a tab brings that sheet to the front over the kit's 400ms
 * and sends the open one back. The tabs are real tabs (roving focus, arrow
 * keys) so the stack reads correctly to a keyboard and a screen reader.
 *
 * The stack is built from two measures: the tab height (44px, the kit's
 * minimum control) and the inset each sheet behind loses on both sides. It
 * holds two papers today and any number later. Every sheet stays mounted on
 * one grid cell, so the stack is as tall as its tallest paper and the page
 * does not shift when a different one opens.
 */

const TAB_PX = 44;
const INSET_PX = 16;

type PublicationStackLabels = {
  view: string;
  /** Accessible name of the stack. */
  stack: string;
  venue: string;
  year: string;
};

type PublicationStackProps = {
  publications: readonly UiPublication[];
  labels: PublicationStackLabels;
  className?: string;
};

const PublicationStack = ({ publications, labels, className }: PublicationStackProps) => {
  const [openId, setOpenId] = useState(() => String(publications[0]?.id ?? ""));
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
      onValueChange={setOpenId}
      orientation="horizontal"
      className={cn("relative", className)}
      style={{ paddingTop: (count - 1) * TAB_PX }}
    >
      <TabsPrimitive.List aria-label={labels.stack} className="contents">
        {publications.map((publication) => {
          const id = String(publication.id);
          const d = depthOf.get(id) ?? 0;
          const isOpen = d === 0;
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
                "transition-[transform,left,right,color,border-color] duration-400 ease-brand motion-reduce:transition-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background",
                isOpen
                  ? "border-b-transparent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* The two titles differ by one word; the domain, drawn small,
                  tells them apart before anyone reads. */}
              {domainFor(publication.title) ? (
                <DomainGlyph kind={domainFor(publication.title)!} className="h-6 shrink-0" />
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

      {/* Every sheet stays mounted on one grid cell, so the stack is as tall
          as its tallest paper and the page does not shift when one opens. */}
      <div className="grid" style={{ marginTop: TAB_PX }}>
        {publications.map((publication) => {
          const domain = domainFor(publication.title);
          return (
            <TabsPrimitive.Content
              key={publication.id}
              value={String(publication.id)}
              forceMount
              style={{ zIndex: count + 1 }}
              className="relative col-start-1 row-start-1 rounded-b-card border border-t-0 border-border bg-card p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-[3px] focus-visible:ring-offset-background data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible data-[state=active]:duration-400 data-[state=active]:ease-brand data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 motion-reduce:data-[state=active]:animate-none md:p-8"
            >
              {/* Three columns on the open sheet: the domain, the paper, and its
                  record — venue, year and the link — so the width is used and
                  the abstract keeps its measure. */}
              <article className="grid gap-6 md:grid-cols-[96px_minmax(0,7fr)_minmax(0,3fr)] md:gap-10">
                {domain ? <DomainGlyph kind={domain} className="h-24" /> : <span />}
                <div>
                  <h3 className="text-card-title-sm font-semibold md:text-card-title">
                    {publication.title}
                  </h3>
                  {publication.summary && (
                    <p className="mt-4 max-w-[52ch] text-base text-muted-foreground">
                      {publication.summary}
                    </p>
                  )}
                </div>
                <dl className="space-y-4 font-mono text-meta md:border-l md:border-border md:pl-8">
                  <div>
                    <dt className="uppercase tracking-widest text-muted-foreground">
                      {labels.venue}
                    </dt>
                    <dd className="mt-1 text-foreground">{publication.journal}</dd>
                  </div>
                  {publication.year > 0 && (
                    <div>
                      <dt className="uppercase tracking-widest text-muted-foreground">
                        {labels.year}
                      </dt>
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
            </TabsPrimitive.Content>
          );
        })}
      </div>
    </TabsPrimitive.Root>
  );
};

export default PublicationStack;
