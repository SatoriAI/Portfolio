import type { ReactNode } from "react";

/**
 * The head of a record card: what it is on the left, when and where it was on
 * the right.
 *
 * The meta column is left-aligned, not right-aligned. Right-aligning a stack of
 * unequal strings — "2022 - Present" over "Remote" — gives each line its own
 * left edge, which is the same fault the hero's proof points had. The column
 * itself still sits to the right; only its contents share an axis.
 *
 * Shared by the experience, school and publication cards, which had three
 * copies of this header between them.
 */
const CardMasthead = ({ title, meta }: { title: ReactNode; meta?: ReactNode }) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-8">
    <div className="min-w-0">{title}</div>
    {meta && (
      <div className="flex shrink-0 flex-col items-start gap-1 font-mono text-meta text-muted-foreground">
        {meta}
      </div>
    )}
  </div>
);

export default CardMasthead;
