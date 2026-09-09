// Stream-repair helpers for the Vex chat transport.
//
// These moved out of ChatWidget so they can be tested directly: they are pure
// string functions with no React in them, and they carry the most delicate
// logic in the frontend. An SSE chunk boundary can split a markdown construct
// anywhere — mid-heading, mid-list, inside a code fence — and the widget has to
// render something coherent on every token, not only at the end.

export const normalizeMarkdown = (input: string): string => {
  let s = String(input ?? "");
  s = s.replace(/\r\n?/g, "\n");
  // Convert en/em/• bullets at line start to markdown hyphen bullets
  s = s.replace(/^\s*[–—•]\s+/gm, "- ");
  s = s.replace(/^(\s{2,})[–—•]\s+/gm, "$1- ");
  // Ensure a blank line before headings and top-level list items so Markdown parses in-flight
  s = s.replace(/(^|[^\n])\n(#{1,6}\s)/g, (m, p1, p2) => `${p1}\n\n${p2}`);
  s = s.replace(/(^|[^\n])\n(-\s)/g, (m, p1, p2) => `${p1}\n\n${p2}`);
  // If headings or lists appear mid-sentence (chunk boundary artifacts), insert needed newlines
  s = s.replace(/([^\n])\s*(#{1,6}\s)/g, "$1\n\n$2");
  s = s.replace(/([^\n])\s*(-\s)/g, "$1\n$2");
  s = s.replace(/([^\n])\s*((?:\d+\.|\d+\))\s)/g, "$1\n$2");
  // If inside an unclosed fenced code block while streaming, temporarily close it
  const fenceCountBackticks = (s.match(/```/g) || []).length;
  const fenceCountTildes = (s.match(/~~~?/g) || []).length; // support ~~~
  const endsWithFenceStart = /```[a-zA-Z0-9_-]*\s*$/.test(s) || /~~~[a-zA-Z0-9_-]*\s*$/.test(s);
  if (fenceCountBackticks % 2 === 1 || fenceCountTildes % 2 === 1 || endsWithFenceStart) {
    // Add a closing fence just for rendering; does not mutate stored message
    s = s + (s.endsWith("\n") ? "" : "\n") + "```\n";
  }
  if (!s.endsWith("\n")) s += "\n";
  return s;
};

// Decode various possible SSE payload formats to a plain text chunk
export const decodeStreamData = (raw: string): string => {
  let data = String(raw ?? "");
  if (!data) return "";
  // Common cases: JSON string token, JSON object with token/text/content/delta, or plain text
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const candidate =
        (parsed as any).token ??
        (parsed as any).delta ??
        (parsed as any).content ??
        (parsed as any).text ??
        (parsed as any).message;
      if (typeof candidate === "string") return candidate;
    }
  } catch {
    // not JSON, continue
  }
  // Sometimes servers double-stringify: "Hello" or escape newlines
  if (
    (data.startsWith('"') && data.endsWith('"')) ||
    (data.startsWith("'") && data.endsWith("'"))
  ) {
    try {
      const dequoted = JSON.parse(data);
      if (typeof dequoted === "string") data = dequoted;
    } catch {
      data = data.slice(1, -1);
    }
  }
  data = data.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "");
  // Ignore common done markers
  if (data === "[DONE]" || data === "DONE" || data === "<|eot_id|>") return "";
  return data;
};

// Perform a final cleanup after streaming ends to guarantee good Markdown structure
export const finalizeMarkdown = (input: string): string => {
  let s = String(input ?? "");
  s = s.replace(/\r\n?/g, "\n");
  // Headings and list items: ensure they start on their own line with a blank line before
  s = s.replace(/([^\n])\s*(#{1,6}\s)/g, "$1\n\n$2");
  s = s.replace(/([^\n])\s*(-\s)/g, "$1\n$2");
  s = s.replace(/([^\n])\s*((?:\d+\.|\d+\))\s)/g, "$1\n$2");
  // Collapse excessive blank lines to at most two
  s = s.replace(/\n{3,}/g, "\n\n");
  if (!s.endsWith("\n")) s += "\n";
  return s;
};
