import type { ReactNode } from "react";

import Reveal from "@/components/Reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  /** Mono label above the title, e.g. "01 / Projects". */
  eyebrow?: string;
  /** Short lead paragraph; kept to a readable 55–70 characters per line. */
  lead?: ReactNode;
  align?: "left" | "center";
  /** Heading level: h1 for a page title, h2 for a section. */
  level?: 1 | 2;
  className?: string;
};

const SectionHeading = ({
  title,
  eyebrow,
  lead,
  align = "left",
  level = 2,
  className,
}: SectionHeadingProps) => {
  const Heading = level === 1 ? "h1" : "h2";
  const centered = align === "center";

  return (
    <Reveal className={cn("mb-8 md:mb-12", centered && "text-center", className)}>
      {eyebrow && (
        <p className="mb-3 font-mono text-meta uppercase tracking-wide text-iris">{eyebrow}</p>
      )}
      <Heading className={cn("text-h2-sm md:text-h2", centered && "mx-auto")}>{title}</Heading>
      {lead && (
        <p
          className={cn(
            "mt-4 max-w-[65ch] text-base text-muted-foreground md:text-body-lg",
            centered && "mx-auto",
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
};

export default SectionHeading;
