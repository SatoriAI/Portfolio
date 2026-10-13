import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { holdBackUnderline, normalizeMarkdown } from "@/lib/streamMarkdown";

type MarkdownMessageProps = {
  text: string;
  /** The reply is still arriving: a trailing line that could be unfinished is held back. */
  streaming?: boolean;
};

// Made once: react-markdown uses each override as an element type, so a new
// function every render would remount every link on every streamed chunk.
const components = {
  a: ({ node: _node, ...props }: ComponentPropsWithoutRef<"a"> & { node?: unknown }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

/**
 * The Markdown renderer for assistant messages. Loaded lazily by the chat:
 * react-markdown and its remark pipeline are the heaviest part of the widget
 * and are only needed once an answer arrives.
 */
const MarkdownMessage = ({ text, streaming = false }: MarkdownMessageProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    components={components}
  >
    {normalizeMarkdown(streaming ? holdBackUnderline(text) : text)}
  </ReactMarkdown>
);

export default MarkdownMessage;
