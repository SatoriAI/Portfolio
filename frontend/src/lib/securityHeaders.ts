/**
 * The headers production sends with every response, as `serve`'s
 * configuration (`serve.json`, emitted into the build by vite.config.ts and
 * read by `serve` from the directory it serves).
 *
 * The policy allows what the site loads and nothing more on the axes that
 * matter: scripts only from the site itself, and no framing at all. Three
 * sources are wider on purpose:
 *
 * - styles allow inline: Radix and sonner inject `<style>` elements at
 *   runtime, and a nonce would need a server that renders each page;
 * - images allow any https host: a project's icon is an address the admin
 *   gives, so the hosts are data, not code;
 * - connections allow any https host for the same reason: the live check
 *   (src/lib/liveCheck.ts) asks each project's own address whether it
 *   answers.
 */
export type ServeConfig = {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};

export function contentSecurityPolicy(apiBaseUrl: string): string {
  const api = new URL(apiBaseUrl).origin;
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // data: for the images and fonts Vite inlines into the bundle.
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    // The API named on its own too, for a build against a local http one.
    `connect-src 'self' https: ${api}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function serveConfig(apiBaseUrl: string): ServeConfig {
  const headers = {
    "Content-Security-Policy": contentSecurityPolicy(apiBaseUrl),
    // No preload: that list is hard to leave, and every subdomain would have to be HTTPS first.
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    // For browsers that predate frame-ancestors.
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Nothing on the site asks for these. The clipboard is left alone: the site copies to it.
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  };
  return {
    headers: [
      {
        source: "**",
        headers: Object.entries(headers).map(([key, value]) => ({ key, value })),
      },
    ],
  };
}
