import { Col, Grid } from "@/components/layout/Grid";
import Reveal from "@/components/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import type { UiTestimonial } from "@/lib/testimonialsService";
import { cn } from "@/lib/utils";

/**
 * What students wrote, all of it visible at once. The carousel showed three
 * at a time behind arrows nobody presses; six short quotes fit on one screen.
 * The first quote is the emphasised one — set larger on a lavender panel,
 * spanning two rows — and the rest stand around it between rules.
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
    <Grid gapY={24} className={cn("lg:grid-flow-dense", className)}>
      <Col as={Reveal} spanLg={6} className="lg:row-span-2">
        <Card tone="lavender" className="h-full">
          <CardContent className="flex h-full flex-col p-8 md:p-10">
            <blockquote className="text-xl font-medium leading-snug text-foreground md:text-card-title">
              {quotes.open}
              {featured.text}
              {quotes.close}
            </blockquote>
            <p className="mt-auto pt-8 font-mono text-meta text-muted-foreground">
              {featured.course} · {featured.semester}
            </p>
          </CardContent>
        </Card>
      </Col>
      {rest.map((testimonial, index) => (
        <Col
          as={Reveal}
          key={testimonial.id}
          spanSm={2}
          spanLg={3}
          delayMs={staggerMs(index)}
          className="flex flex-col border-t border-border pt-5"
        >
          <blockquote className="text-base text-foreground">
            {quotes.open}
            {testimonial.text}
            {quotes.close}
          </blockquote>
          <p className="mt-auto pt-5 font-mono text-meta text-muted-foreground">
            {testimonial.course} · {testimonial.semester}
          </p>
        </Col>
      ))}
    </Grid>
  );
};

export default QuoteWall;
