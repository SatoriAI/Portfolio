import { BookOpen, ExternalLink } from "lucide-react";

import CardMasthead from "@/components/cards/CardMasthead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UiPublication } from "@/lib/publicationsService";

type PublicationCardProps = {
  publication: UiPublication;
  labels: { view: string };
  className?: string;
};

const PublicationCard = ({ publication, labels, className }: PublicationCardProps) => (
  <Card className={className}>
    <CardHeader className="gap-3">
      <CardMasthead
        title={
          <div className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lavender text-iris"
            >
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-xl md:text-xl">{publication.title}</CardTitle>
              <p className="mt-2 font-mono text-meta text-muted-foreground">
                {publication.journal}
                {publication.year ? ` · ${publication.year}` : ""}
              </p>
            </div>
          </div>
        }
        meta={
          publication.link && (
            <Button variant="outline" size="sm" className="hidden md:inline-flex" asChild>
              <a href={publication.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {labels.view}
              </a>
            </Button>
          )
        }
      />
    </CardHeader>
    {(publication.summary || publication.link) && (
      <CardContent className="space-y-4">
        {publication.summary && <p className="text-muted-foreground">{publication.summary}</p>}
        {publication.link && (
          <Button variant="outline" size="sm" className="w-full md:hidden" asChild>
            <a href={publication.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {labels.view}
            </a>
          </Button>
        )}
      </CardContent>
    )}
  </Card>
);

export default PublicationCard;
