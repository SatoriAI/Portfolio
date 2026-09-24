import Reveal from "@/components/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import type { UiTestimonial } from "@/lib/testimonialsService";
import { cn } from "@/lib/utils";

/**
 * What students wrote, all of it visible at once. The carousel showed three
 * at a time behind arrows nobody presses; six short quotes fit on one screen.
 * The first quote is the emphasised one — set larger on a white card — and the
 * rest flow round it in columns, each between rules. Columns rather than a
 * grid, so an odd count leaves no lonely row and the card is exactly as tall
 * as its quote. The wall sits on the colour field, which is why the card is
 * white: a lavender card on a lavender field was one tint too many.
 */

type QuoteWallProps = {
  testimonials: readonly UiTestimonial[];
  /** The language's quotation marks: „ ” in Polish, “ ” in English. */
  quotes: { open: string; close: string };
  className?: string;
};

const staggerMs = (index: number) => Math.min(index, 2) * 60;

const QuoteWall = ({ testimonials, quotes, className }: QuoteWallProps) => {
  const [featured, ...rest] = testimonials;
  if (!featured) return null;

  return (
    <div className={cn("columns-1 gap-6 md:columns-2 lg:columns-3", className)}>
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
      {rest.map((testimonial, index) => (
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
  );
};

export default QuoteWall;
