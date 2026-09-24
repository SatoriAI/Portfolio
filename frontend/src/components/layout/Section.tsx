import type { HTMLAttributes } from "react";

import Container from "@/components/layout/Container";
import { cn } from "@/lib/utils";

type SectionProps = HTMLAttributes<HTMLElement> & {
  /** Pastel tones mark highlighted sections; keep them for backgrounds only. */
  tone?: "default" | "surface" | "lavender";
  /** Set when the section paints its own background and needs no Container. */
  bleed?: boolean;
};

const toneClassName: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "",
  surface: "bg-card",
  lavender: "bg-lavender",
};

/** Vertical rhythm from the kit: 48px between sections on phones, 80px on desktop. */
const Section = ({
  tone = "default",
  bleed = false,
  className,
  children,
  ...props
}: SectionProps) => (
  <section className={cn("scroll-mt-20 py-12 md:py-20", toneClassName[tone], className)} {...props}>
    {bleed ? children : <Container>{children}</Container>}
  </section>
);

export default Section;
