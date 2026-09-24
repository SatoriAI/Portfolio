import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UiPublication } from "@/lib/publicationsService";
import { cn } from "@/lib/utils";

/**
 * A paper as a bibliographic entry: venue and year in mono, the title, the
 * abstract, and the link. Two of them stand side by side; a card around
 * each would only have put a border between the reader and the abstract.
 */

type PublicationEntryProps = {
  publication: UiPublication;
  labels: { view: string };
  className?: string;
};

const PublicationEntry = ({ publication, labels, className }: PublicationEntryProps) => (
  <article className={cn("flex h-full flex-col border-t border-border pt-6", className)}>
    <p className="font-mono text-meta text-iris">
      {publication.journal}
      {publication.year ? ` · ${publication.year}` : ""}
    </p>
    <h3 className="mt-3 text-card-title-sm font-semibold md:text-card-title">
      {publication.title}
    </h3>
    {publication.summary && (
      <p className="mt-4 max-w-[60ch] text-base text-muted-foreground">{publication.summary}</p>
    )}
    {publication.link && (
      <div className="mt-auto pt-6">
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
  </article>
);

export default PublicationEntry;
