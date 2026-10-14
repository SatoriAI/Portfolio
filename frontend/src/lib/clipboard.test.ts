import { afterEach, describe, expect, it, vi } from "vitest";

import { copyText } from "./clipboard";

/** A stand-in for the document the fallback copies through, recording what it did. */
const fakeDocument = (copies: boolean | Error) => {
  const field = {
    value: "",
    style: {},
    setAttribute: vi.fn(),
    select: vi.fn(),
    remove: vi.fn(),
  };
  const focused = { focus: vi.fn() };
  const doc = {
    activeElement: focused,
    body: { appendChild: vi.fn() },
    createElement: vi.fn(() => field),
    execCommand: vi.fn(() => {
      if (copies instanceof Error) throw copies;
      return copies;
    }),
  };
  vi.stubGlobal("document", doc);
  return { doc, field, focused };
};

describe("copyText", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("writes through the Clipboard API where there is one", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { doc } = fakeDocument(true);
    expect(await copyText("## Answer\n\n- one")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("## Answer\n\n- one");
    expect(doc.execCommand).not.toHaveBeenCalled();
  });

  it("falls back to selecting a hidden field when the API is missing", async () => {
    vi.stubGlobal("navigator", {});
    const { doc, field, focused } = fakeDocument(true);
    expect(await copyText("text")).toBe(true);
    expect(field.value).toBe("text");
    expect(field.select).toHaveBeenCalled();
    expect(doc.execCommand).toHaveBeenCalledWith("copy");
    // The field goes, and focus returns to the button that copied.
    expect(field.remove).toHaveBeenCalled();
    expect(focused.focus).toHaveBeenCalled();
  });

  it("falls back when the API refuses", async () => {
    const writeText = vi.fn(async () => {
      throw new DOMException("Document is not focused.", "NotAllowedError");
    });
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { doc } = fakeDocument(true);
    expect(await copyText("text")).toBe(true);
    expect(doc.execCommand).toHaveBeenCalledWith("copy");
  });

  it("says so when neither way copies", async () => {
    vi.stubGlobal("navigator", {});
    const { field } = fakeDocument(false);
    expect(await copyText("text")).toBe(false);
    expect(field.remove).toHaveBeenCalled();
    fakeDocument(new Error("not supported"));
    expect(await copyText("text")).toBe(false);
  });
});
