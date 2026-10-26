import type { ReactNode } from "react";

/**
 * The research story's paragraphs, set as the site's prose is on the home
 * page: 16px on phones, 18/29 from md, at most 52ch.
 */
export const STORY_PROSE = "max-w-[52ch] text-base text-muted-foreground md:text-body-lg";

/** A link inside the story's prose: iris, underlined, ink on hover. */
export const LINK =
  "text-iris underline decoration-1 underline-offset-4 transition-colors hover:text-foreground";

/**
 * A paragraph with the words that name a paper, where it has them, as a link
 * to the paper: the way the quantum thread links its estimates in passing.
 */
export const withPaper = (
  paragraph: string,
  paper: string | undefined,
  href: string,
): ReactNode => {
  const at = paper ? paragraph.indexOf(paper) : -1;
  if (!paper || at < 0) return paragraph;
  return (
    <>
      {paragraph.slice(0, at)}
      <a className={LINK} href={href} target="_blank" rel="noopener noreferrer">
        {paper}
      </a>
      {paragraph.slice(at + paper.length)}
    </>
  );
};
