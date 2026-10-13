// Markdown repair for Vex's answers.
//
// These live outside ChatWidget so they can be tested directly: they are pure
// string functions with no React in them. The stream delivers the model's text
// exactly (see lib/vexStream), but a partial answer is still unfinished
// markdown — a code fence opened and not yet closed — and the widget has to
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

// The model does not write U+0000 (normalizeMarkdown strips it to be sure), so
// a placeholder built from it can never collide with message content, and it
// carries no character the prose rules look for.
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

/**
 * Rewrite the bullet characters the model sometimes starts a line with (•, –,
 * —) as markdown list items, keeping their indentation, so they render as a
 * list rather than as a paragraph of dashes.
 */
const repairProse = (input: string): string => input.replace(/^([ \t]*)[–—•][ \t]+/gm, "$1- ");

const endWithNewline = (s: string): string => (s.endsWith("\n") ? s : `${s}\n`);

/**
 * Repair a message for rendering. This runs on every render, not only
 * mid-stream, so it has to be safe to apply repeatedly to text it has already
 * repaired.
 */
export const normalizeMarkdown = (input: string): string => {
  const normalized = String(input ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\u0000")
    .join("");
  const { text, blocks, unterminated } = protectFences(normalized);
  let s = restoreFences(repairProse(text), blocks);

  // A fence the stream has not closed yet would swallow the rest of the message,
  // so close it for rendering. The stored message is untouched.
  if (unterminated !== null) {
    s = endWithNewline(s) + unterminated + "\n";
  }

  return endWithNewline(s);
};

// A line of only `-` or `=` under a paragraph turns the paragraph into a
// heading (a setext heading), and a lone `-` is how a list item starts. Mid-
// stream such a line is usually unfinished: the model is part-way through a
// rule, or a list item.
const PARTIAL_UNDERLINE = /\n {0,3}(?:-+|=+)[ \t]*$/;

/**
 * Hold back the last line of a reply still streaming while it consists only of
 * `-` or `=`, so the paragraph above it does not flash as a heading before the
 * rest of the line arrives. Once the line ends, or the reply does, it shows.
 */
export const holdBackUnderline = (text: string): string => text.replace(PARTIAL_UNDERLINE, "\n");
