import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps the kit's text sizes beside a colour", () => {
    expect(cn("text-meta text-muted-foreground")).toBe("text-meta text-muted-foreground");
    expect(cn("text-body-lg", "text-foreground")).toBe("text-body-lg text-foreground");
  });

  it("lets a later size, shadow or radius override an earlier one", () => {
    expect(cn("text-sm", "text-meta")).toBe("text-meta");
    expect(cn("shadow-lift", "shadow-float")).toBe("shadow-float");
    expect(cn("rounded-xl", "rounded-card")).toBe("rounded-card");
  });

  it("keeps a fill colour beside an animation fill mode", () => {
    expect(cn("fill-primary animate-in fill-mode-both")).toBe(
      "fill-primary animate-in fill-mode-both",
    );
    expect(cn("fill-mode-none", "fill-mode-both")).toBe("fill-mode-both");
  });
});
