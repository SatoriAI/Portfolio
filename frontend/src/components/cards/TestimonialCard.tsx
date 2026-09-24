import { Quote } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UiTestimonial } from "@/lib/testimonialsService";

type TestimonialCardProps = {
  testimonial: UiTestimonial;
  className?: string;
};

const TestimonialCard = ({ testimonial, className }: TestimonialCardProps) => (
  <Card className={className}>
    <CardHeader className="gap-3">
      <Quote className="h-6 w-6 text-iris" aria-hidden="true" />
      <div>
        <CardTitle className="text-xl md:text-xl">{testimonial.course}</CardTitle>
        {testimonial.semester && (
          <p className="mt-1 font-mono text-meta text-muted-foreground">{testimonial.semester}</p>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <blockquote className="text-muted-foreground">{testimonial.text}</blockquote>
    </CardContent>
  </Card>
);

export default TestimonialCard;
