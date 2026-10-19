import { describe, expect, it } from "vitest";

import { arrivalScroll } from "./arrivalScroll";

describe("arrivalScroll", () => {
  it("leaves the page it opened on where the browser put it", () => {
    // Scrolled before the script ran, or reloaded mid-page: no jump to the top.
    expect(arrivalScroll({ landing: true, traversal: false, hash: "" })).toBe("stay");
  });

  it("goes to the top on a link to another page", () => {
    expect(arrivalScroll({ landing: false, traversal: false, hash: "" })).toBe("top");
  });

  it("goes to the hash's section, on landing as on a link", () => {
    expect(arrivalScroll({ landing: true, traversal: false, hash: "#projects" })).toBe("section");
    expect(arrivalScroll({ landing: false, traversal: false, hash: "#about" })).toBe("section");
  });

  it("leaves Back and Forward to the browser", () => {
    expect(arrivalScroll({ landing: false, traversal: true, hash: "" })).toBe("stay");
    expect(arrivalScroll({ landing: false, traversal: true, hash: "#about" })).toBe("stay");
  });
});
