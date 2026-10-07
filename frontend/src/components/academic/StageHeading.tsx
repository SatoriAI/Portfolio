type StageHeadingProps = {
  title: string;
};

/**
 * A stage heading within a story: an iris dot, the title in mono capitals,
 * and a hairline running to the right edge. An h3 beneath the section's h2.
 * If the title wraps on a phone, the dot stays beside its first line.
 */
const StageHeading = ({ title }: StageHeadingProps) => (
  <h3 className="mb-6 flex items-start gap-3 font-mono text-meta uppercase tracking-widest text-foreground md:mb-8">
    <span aria-hidden="true" className="mt-[0.45em] h-2 w-2 shrink-0 rounded-full bg-iris" />
    <span>{title}</span>
    <span aria-hidden="true" className="h-px flex-1 self-center bg-border" />
  </h3>
);

export default StageHeading;
