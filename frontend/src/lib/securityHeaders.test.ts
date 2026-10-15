import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, serveConfig } from "./securityHeaders";

const directives = (policy: string) =>
  Object.fromEntries(
    policy.split("; ").map((directive) => {
      const [name, ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );

describe("contentSecurityPolicy", () => {
  it("lets the site reach the API it was built against, by origin", () => {
    const policy = directives(contentSecurityPolicy("http://localhost:8000/"));
    expect(policy["connect-src"]).toContain("http://localhost:8000");
  });

  it("runs only the site's own scripts and is framed by nothing", () => {
    const policy = directives(contentSecurityPolicy("https://api.example.com"));
    expect(policy["script-src"]).toEqual(["'self'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
  });
});

describe("serveConfig", () => {
  it("sends every header on every path", () => {
    const [rule] = serveConfig("https://api.example.com").headers;
    expect(rule.source).toBe("**");
    expect(rule.headers.map(({ key }) => key)).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
      ]),
    );
  });
});
