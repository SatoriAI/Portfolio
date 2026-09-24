export type ProofPoint = {
  value: string;
  label: string;
};

type ProofPointsProps = {
  items: readonly ProofPoint[];
};

/**
 * Three concrete facts beside the hero. Each item carries its own small navy
 * square — the kit's geometry as a detail.
 *
 * The shape is fixed here rather than taken from the call site: a layout class
 * passed in competes with these and wins only by stylesheet order. It was also
 * how the list went wrong — right-aligning items of unequal width gave the three
 * bullets three different left edges (measured 1060, 1069 and 992), which is the
 * one thing a bulleted list must never do.
 *
 * On phones the items read as a wrapped row; from lg they stack into a single
 * column, value over label, so every item starts on one axis and the whole block
 * fits a 3-column span in both languages.
 */
const ProofPoints = ({ items }: ProofPointsProps) => (
  <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-4 lg:flex-col lg:items-start lg:gap-y-6">
    {items.map((item) => (
      <li key={item.label} className="flex items-baseline gap-3 lg:block">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-motif bg-primary lg:mr-4 lg:inline-block"
        />
        <span className="font-mono text-2xl text-foreground">{item.value}</span>
        {/* Bullet (8) + lg:mr-4 (16) = 24, so the label sits exactly under the value. */}
        <span className="text-sm text-muted-foreground lg:mt-1 lg:block lg:pl-6">{item.label}</span>
      </li>
    ))}
  </ul>
);

export default ProofPoints;
