import { formatDate } from "@/lib/workshop";

type MetaLineProps = {
  date: string;
  locale: string;
  /** Reading time, already filled in, e.g. "5 min czytania". */
  minutes: string;
  tags: readonly string[];
  /** Accessible name of the topics. */
  tagsLabel: string;
  className?: string;
};

/**
 * A piece's details on one line, the same wherever it is listed or read:
 * the date in iris capitals, then the reading time and the topics in grey.
 * Each item keeps its own dot in front, so a line never ends on a dot and
 * the gaps either side of it are even.
 */
const MetaLine = ({ date, locale, minutes, tags, tagsLabel, className }: MetaLineProps) => {
  const DOT = "before:mx-2 before:content-['·']";
  return (
    <p className={className}>
      <span className="flex flex-wrap gap-y-1 font-mono text-meta">
        <time dateTime={date} className="whitespace-nowrap uppercase tracking-widest text-iris">
          {formatDate(date, locale)}
        </time>
        <span className={`whitespace-nowrap text-muted-foreground ${DOT}`}>{minutes}</span>
        {tags.length > 0 && (
          <span aria-label={tagsLabel} className="contents">
            {tags.map((tag) => (
              <span key={tag} className={`whitespace-nowrap text-muted-foreground ${DOT}`}>
                {tag}
              </span>
            ))}
          </span>
        )}
      </span>
    </p>
  );
};

export default MetaLine;
