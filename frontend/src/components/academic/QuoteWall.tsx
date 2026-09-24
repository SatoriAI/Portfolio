import { useState } from "react";

import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { UiTestimonial } from "@/lib/testimonialsService";

/**
 * What students wrote. Three quotes at first — the emphasised one on a white
 * card, two beside it between rules — and the rest a press away, since six
 * reassure without saying more than three. Columns rather than a grid, so an
 * odd count leaves no lonely row and the card is exactly as tall as its
 * quote. The wall sits on the colour field, which is why the card is white:
 * a lavender card on a lavender field was one tint too many.
 */

const INITIAL = 3;

type QuoteWallProps = {
  testimonials: readonly UiTestimonial[];
  /** The language's quotation marks: „ ” in Polish, “ ” in English. */
  quotes: { open: string; close: string };
  labels: {
    /** `{count}` is replaced with the total. */
    showAll: string;
    showFewer: string;
  };
  className?: string;
};

const staggerMs = (index: number) => Math.min(index, 2) * 60;

const QuoteWall = ({ testimonials, quotes, labels, className }: QuoteWallProps) => {
  const [expanded, setExpanded] = useState(false);
  const [featured, ...rest] = testimonials;
  if (!featured) return null;
  const shown = expanded ? rest : rest.slice(0, INITIAL - 1);
  const hidden = testimonials.length - INITIAL;

  return (
    <div className={className}>
      <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
        <Reveal className="mb-6 break-inside-avoid">
          <Card>
            <CardContent className="p-8">
              <blockquote className="text-xl font-medium leading-snug text-foreground md:text-card-title-sm">
                {quotes.open}
                {featured.text}
                {quotes.close}
              </blockquote>
              <p className="mt-6 font-mono text-meta text-muted-foreground">
                {featured.course} · {featured.semester}
              </p>
            </CardContent>
          </Card>
        </Reveal>
        {shown.map((testimonial, index) => (
          <Reveal
            key={testimonial.id}
            delayMs={staggerMs(index)}
            className="mb-6 break-inside-avoid border-t border-border pt-5"
          >
            <blockquote className="text-base text-foreground">
              {quotes.open}
              {testimonial.text}
              {quotes.close}
            </blockquote>
            <p className="mt-4 font-mono text-meta text-muted-foreground">
              {testimonial.course} · {testimonial.semester}
            </p>
          </Reveal>
        ))}
      </div>
      {hidden > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded
            ? labels.showFewer
            : labels.showAll.replace("{count}", String(testimonials.length))}
        </Button>
      )}
    </div>
  );
};

export default QuoteWall;
