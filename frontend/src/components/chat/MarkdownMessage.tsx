import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { normalizeMarkdown } from "@/lib/streamMarkdown";

type MarkdownMessageProps = {
  text: string;
};

/**
 * The Markdown renderer for assistant messages. Loaded lazily by the chat:
 * react-markdown and its remark pipeline are the heaviest part of the widget
 * and are only needed once an answer arrives.
 */
const MarkdownMessage = ({ text }: MarkdownMessageProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
    components={{
      a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    }}
  >
    {normalizeMarkdown(text)}
  </ReactMarkdown>
);

export default MarkdownMessage;
