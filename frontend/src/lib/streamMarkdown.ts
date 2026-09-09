// Stream-repair helpers for the Vex chat transport.
//
// These live outside ChatWidget so they can be tested directly: they are pure
// string functions with no React in them, and they carry the most delicate
// logic in the frontend. An SSE chunk boundary can split a markdown construct
// anywhere — mid-heading, mid-list, inside a code fence — and the widget has to
// render something coherent on every token, not only at the end.
//
// The repair rules apply to prose only. Everything inside a fenced code block is
// lifted out before they run and put back afterwards, because a code block means
// "reproduce this literally", and a repair that edits it is corruption rather
// than help.

// A fence is a line-level construct: three or more backticks or tildes, indented
// by at most three spaces. Matching per line rather than anywhere in the string
// is what stops inline `code` and ~~strikethrough~~ being mistaken for fences.
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})/;

// U+0000 cannot appear in an SSE payload, so a placeholder built from it can
// never collide with message content, and it carries no character the prose
// rules look for.
const placeholder = (index: number): string => `\u0000${index}\u0000`;

type ProtectedText = {
  /** The message with each fenced block replaced by a placeholder. */
  text: string;
  /** The extracted blocks, indexed by placeholder. */
  blocks: string[];
  /** The opening delimiter of a block the stream has not closed yet, if any. */
  unterminated: string | null;
};

const protectFences = (input: string): ProtectedText => {
  const out: string[] = [];
  const blocks: string[] = [];
  let open: string[] | null = null;
  let opener = "";

  for (const line of input.split("\n")) {
    const match = FENCE_LINE.exec(line);

    if (open === null) {
      if (match) {
        open = [line];
        opener = match[1];
      } else {
        out.push(line);
      }
      continue;
    }

    open.push(line);

    // A closing fence uses the same character, is at least as long as the
    // opener, and carries no info string.
    const closes =
      match !== null &&
      match[1][0] === opener[0] &&
      match[1].length >= opener.length &&
      line.slice(line.indexOf(match[1]) + match[1].length).trim() === "";

    if (closes) {
      out.push(placeholder(blocks.length));
      blocks.push(open.join("\n"));
      open = null;
      opener = "";
    }
  }

  if (open === null) {
    return { text: out.join("\n"), blocks, unterminated: null };
  }

  out.push(placeholder(blocks.length));
  blocks.push(open.join("\n"));
  return { text: out.join("\n"), blocks, unterminated: opener };
};

const restoreFences = (text: string, blocks: string[]): string =>
  blocks.reduce((acc, block, index) => acc.split(placeholder(index)).join(block), text);

/** Give headings and list items the line breaks markdown needs to parse them. */
const repairProse = (input: string): string => {
  let s = input;
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
  return s;
};

const endWithNewline = (s: string): string => (s.endsWith("\n") ? s : `${s}\n`);

/**
 * Repair a message for rendering. This runs on every render, not only
 * mid-stream, so it has to be safe to apply repeatedly to text it has already
 * repaired.
 */
export const normalizeMarkdown = (input: string): string => {
  const normalized = String(input ?? "").replace(/\r\n?/g, "\n");
  const { text, blocks, unterminated } = protectFences(normalized);
  let s = restoreFences(repairProse(text), blocks);

  // A fence the stream has not closed yet would swallow the rest of the message,
  // so close it for rendering. The stored message is untouched.
  if (unterminated !== null) {
    s = endWithNewline(s) + unterminated + "\n";
  }

  return endWithNewline(s);
};

/**
 * Final cleanup once the stream has closed. Unlike normalizeMarkdown this does
 * not invent a closing fence: at that point an unclosed block is what the model
 * actually produced, and the stored message should record it faithfully.
 */
export const finalizeMarkdown = (input: string): string => {
  const normalized = String(input ?? "").replace(/\r\n?/g, "\n");
  const { text, blocks } = protectFences(normalized);
  // Collapse runs of blank lines outside code, where they carry no meaning.
  const repaired = repairProse(text).replace(/\n{3,}/g, "\n\n");
  return endWithNewline(restoreFences(repaired, blocks));
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
