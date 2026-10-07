import type { ReactNode } from "react";

import Reveal from "@/components/Reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  /** Mono label above the title, e.g. "01 / Projects". */
  eyebrow?: string;
  /**
   * The lead's first sentence, on its own line. From `lg` up it may run the
   * full width of its column, so a sentence that fits is never broken.
   */
  leadLine?: ReactNode;
  /** Short lead paragraph; kept to a readable 55–70 characters per line. */
  lead?: ReactNode;
  /** A line under the lead that the section keeps current, e.g. live results. */
  note?: ReactNode;
  align?: "left" | "center";
  /** Heading level: h1 for a page title, h2 for a section. */
  level?: 1 | 2;
  className?: string;
};

const SectionHeading = ({
  title,
  eyebrow,
  leadLine,
  lead,
  note,
  align = "left",
  level = 2,
  className,
}: SectionHeadingProps) => {
  const Heading = level === 1 ? "h1" : "h2";
  const centered = align === "center";

  return (
    <Reveal className={cn("mb-8 md:mb-12", centered && "text-center", className)}>
      {eyebrow && (
        // A point the home page's circuit runs past (see Circuit).
        <p
          data-circuit-node
          className="mb-3 font-mono text-meta uppercase tracking-widest text-iris"
        >
          {eyebrow}
        </p>
      )}
      <Heading className={cn("text-h2-sm md:text-h2", centered && "mx-auto")}>{title}</Heading>
      {(leadLine || lead || note) && (
        <div className="mt-4 space-y-2 text-base text-muted-foreground md:text-body-lg">
          {leadLine && (
            <p className={cn("max-w-[52ch] lg:max-w-none", centered && "mx-auto")}>{leadLine}</p>
          )}
          {lead && <p className={cn("max-w-[52ch] text-pretty", centered && "mx-auto")}>{lead}</p>}
          {note}
        </div>
      )}
    </Reveal>
  );
};

export default SectionHeading;
