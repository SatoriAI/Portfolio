import { Children, type CSSProperties, type ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import remarkGfm from "remark-gfm";

import { Formula, MathText } from "@/components/Formula";
import { EXHIBITS } from "@/components/workshop/exhibitRegistry";
import type { ExhibitLabels } from "@/components/workshop/exhibits";
import { fillTemplate } from "@/lib/text";
import { typeset } from "@/lib/typography";
import { cn } from "@/lib/utils";

/**
 * A piece from the workshop, set in the kit's reading type: 20/32 body from
 * md (18/29 on a phone), headings a clear step above it, links in iris and
 * underlined, lists with the kit's plain markers. Formulas are the site's
 * own, `$…$` inline and `$$…$$` on a line of their own; anything the formula
 * notation cannot read shows as code rather than breaking the page. Code
 * blocks sit on white with a copy button above the code. A link to a page of
 * this site stays in the site, as do footnotes and in-page anchors; a link
 * elsewhere opens a new tab. An image on its own line is a figure, its
 * markdown title the visible caption and its alt text for screen readers.
 * An image whose address is `/figure/<name>` is one of the site's own
 * drawings instead (see exhibitRegistry), set where the text needs it:
 * `![what it shows](/figure/grokking "Caption")`.
 * Long words and URLs wrap rather than running out of the column.
 */

/** What react-markdown hands each element's renderer; the module is typed loosely. */
type ElementProps = {
  children?: ReactNode;
  node?: { children?: { type: string; tagName?: string; value?: string }[] };
  href?: string;
  src?: string;
  alt?: string;
  title?: string;
  id?: string;
  className?: string;
  [attribute: string]: unknown;
};
type Components = Record<string, (props: ElementProps) => ReactNode>;

type ArticleBodyProps = {
  markdown: string;
  labels: { copy: string; copied: string; footnotes: string; backToText: string };
  /** The labels of the site's own drawings, for `/figure/<name>` images. */
  figureLabels?: ExhibitLabels;
  /** The piece's language, for its typographic rules (Polish one-letter words). */
  language?: string;
};

/** The reading size, shared by paragraphs and lists. */
const BODY = "text-[18px] leading-[29px] text-foreground/90 md:text-xl md:leading-8";

/** Plain strings among the children carry formulas; the rest are left be. */
const withMath = (children: ReactNode, language: string) =>
  Children.map(children, (child) =>
    typeof child === "string" ? <MathText text={typeset(child, language)} /> : child,
  );

const H2 =
  "mb-4 mt-12 text-card-title-sm font-semibold text-foreground md:text-card-title lg:text-h2-sm";

const LIST = "mb-6 space-y-2 pl-6 [&>li>p:last-child]:mb-0 [&>li>p]:mb-3";

const LINK =
  "text-iris underline decoration-1 underline-offset-4 transition-colors duration-200 hover:text-foreground";

const CodeBlock = ({
  children,
  labels,
}: {
  children: ReactNode;
  labels: ArticleBodyProps["labels"];
}) => {
  const [copied, setCopied] = useState(false);
  const text = Children.toArray(children)
    .map((child) =>
      typeof child === "object" && child !== null && "props" in child
        ? String((child.props as { children?: unknown }).children ?? "")
        : String(child),
    )
    .join("");
  const copy = () =>
    navigator.clipboard?.writeText(text.replace(/\n$/, "")).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  return (
    <div className="relative my-8">
      {/* The top padding keeps the code's first line clear of the button. */}
      <pre className="overflow-x-auto rounded-lg border border-border bg-card p-5 pt-11 font-mono text-sm leading-6 text-foreground">
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-meta text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-3.5" />
        ) : (
          <Copy aria-hidden="true" className="size-3.5" />
        )}
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
};

const ArticleBody = ({ markdown, labels, figureLabels, language = "en" }: ArticleBodyProps) => {
  const components: Components = {
    // A piece's own title is the page's h1, so a stray one steps down.
    h1: ({ node: _node, className, ...rest }) => <h2 {...rest} className={cn(H2, className)} />,
    // gfm's footnote heading arrives with its own class (sr-only) and id.
    h2: ({ node: _node, className, ...rest }) => <h2 {...rest} className={cn(H2, className)} />,
    h3: ({ node: _node, className, ...rest }) => (
      <h3
        {...rest}
        className={cn(
          "mb-3 mt-10 text-body-lg font-semibold text-foreground lg:text-card-title-sm",
          className,
        )}
      />
    ),
    h4: ({ node: _node, className, ...rest }) => (
      <h4
        {...rest}
        className={cn("mb-3 mt-8 text-body-lg font-semibold text-foreground", className)}
      />
    ),
    p: ({ node, children }) => {
      // An image alone in its paragraph is a figure, not text.
      const kids = (node?.children ?? []).filter(
        (child) => !(child.type === "text" && !child.value?.trim()),
      );
      if (kids.length === 1 && kids[0].tagName === "img") return <>{children}</>;
      // A formula alone on its line, between double dollars, is set apart.
      const only = Children.toArray(children);
      const display =
        only.length === 1 && typeof only[0] === "string"
          ? /^\$\$([\s\S]+)\$\$$/.exec(only[0].trim())
          : null;
      if (display) {
        return (
          <div className="my-8 overflow-x-auto text-center text-xl">
            <Formula tex={display[1].trim()} block />
          </div>
        );
      }
      return <p className={cn("mb-6", BODY)}>{withMath(children, language)}</p>;
    },
    li: ({ node: _node, children, ...rest }) => (
      <li {...rest} className="pl-1">
        {withMath(children, language)}
      </li>
    ),
    // In a loose list each item holds paragraphs; they keep the list's rhythm.
    ul: ({ children }) => (
      <ul className={cn(LIST, "list-disc marker:text-iris", BODY)}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={cn(LIST, "list-decimal marker:font-mono marker:text-iris", BODY)}>
        {children}
      </ol>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-2 border-iris pl-6 italic text-foreground">
        {children}
      </blockquote>
    ),
    em: ({ children }) => <em>{withMath(children, language)}</em>,
    // Footnote links carry ids and data attributes the back-links need.
    a: ({ node: _node, href = "", children, className, ...rest }) =>
      href.startsWith("/") ? (
        <Link {...rest} to={href} className={cn(LINK, className)}>
          {children}
        </Link>
      ) : href.startsWith("#") || href.startsWith("mailto:") ? (
        <a {...rest} href={href} className={cn(LINK, className)}>
          {children}
        </a>
      ) : (
        <a
          {...rest}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(LINK, className)}
        >
          {children}
        </a>
      ),
    code: ({ children }) => (
      <code className="rounded-motif bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      // The block's inner <code> keeps the plain look; the block sets the frame.
      <CodeBlock labels={labels}>
        {Children.map(children, (child) =>
          typeof child === "object" && child !== null && "props" in child
            ? (child.props as { children?: ReactNode }).children
            : child,
        )}
      </CodeBlock>
    ),
    // `![alt](src "caption")`: the alt is read out, the title is shown.
    img: ({ src, alt, title }) => {
      const drawing = src?.startsWith("/figure/") ? EXHIBITS[src.slice(8)] : undefined;
      if (drawing && figureLabels) {
        return (
          <figure className="my-8 rounded-card border border-border bg-card p-6 md:p-8">
            {/* The drawing itself is hidden from assistive technology; the alt says what it shows. */}
            {alt && <span className="sr-only">{alt}</span>}
            {drawing(figureLabels)}
            {title && (
              <figcaption className="mt-4 text-sm text-muted-foreground">{title}</figcaption>
            )}
          </figure>
        );
      }
      return (
        <figure className="my-8">
          <img
            src={src}
            alt={alt ?? ""}
            loading="lazy"
            className="w-full rounded-lg border border-border"
          />
          {title && <figcaption className="mt-3 text-sm text-muted-foreground">{title}</figcaption>}
        </figure>
      );
    },
    hr: () => <hr className="my-12 border-border" />,
    table: ({ children }) => (
      <div className="my-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-base">{children}</table>
      </div>
    ),
    // Headers wrap, so a long one does not take the table's width; a column
    // the Markdown aligns right (`---:`) holds figures, kept on one line and
    // set in tabular digits so they line up.
    th: ({ children, style }) => (
      <th
        style={style as CSSProperties | undefined}
        className="border-b border-border py-2 pr-4 align-bottom font-mono text-meta font-normal text-muted-foreground"
      >
        {children}
      </th>
    ),
    // A row whose first cell is set in bold is the one the piece chose: it
    // takes iris and a 2px rule at its start, so the eye finds it first.
    tr: ({ node, children }) => {
      const first = (node?.children ?? []).find((child) => child.tagName === "td") as
        | { children?: { tagName?: string }[] }
        | undefined;
      const chosen = first?.children?.[0]?.tagName === "strong";
      return (
        <tr
          className={cn(
            chosen &&
              "text-iris [&>td:first-child]:border-l-2 [&>td:first-child]:border-l-iris [&>td:first-child]:pl-3",
          )}
        >
          {children}
        </tr>
      );
    },
    td: ({ children, style }) => (
      <td
        style={style as CSSProperties | undefined}
        className={cn(
          "border-b border-border/60 py-2 pr-4 align-top",
          (style as CSSProperties | undefined)?.textAlign === "right" &&
            "whitespace-nowrap tabular-nums",
        )}
      >
        {withMath(children, language)}
      </td>
    ),
  };

  return (
    // No width of its own: the page sets the reading column (see
    // WorkshopArticle), so the body and the summary above it end on one edge.
    <div className="break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        remarkRehypeOptions={{
          footnoteLabel: labels.footnotes,
          footnoteBackLabel: (index: number) => fillTemplate(labels.backToText, { n: index + 1 }),
        }}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default ArticleBody;
