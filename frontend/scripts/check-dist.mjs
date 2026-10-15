// Run after `vite build`: checks the HTML the build wrote, which no unit test
// sees. Every address in the sitemap must have its file, and every page must
// name its language (Polish under pl/) and its canonical address, and its
// alternates in both languages and x-default (a workshop piece written in one
// language only has none); 404.html must name no address at all; and no file
// may carry a script that runs from inline, nor a theme baked into <html>,
// nor lack boot.js (theme and language before the first paint). An inline
// script would work locally and be blocked in production by the site's
// policy (script-src 'self').
import { readdir, readFile } from "fs/promises";
import path from "path";

const dist = process.argv[2] ?? "dist";
const DATA_SCRIPTS = new Set(["application/json", "application/ld+json"]);
const HREFLANGS = ["en", "pl", "x-default"];

const files = (await readdir(dist, { recursive: true }))
  .filter((name) => name.endsWith(".html"))
  .sort();
const problems = [];

for (const file of files) {
  const html = await readFile(path.join(dist, file), "utf8");
  const fail = (problem) => problems.push(`${file}: ${problem}`);

  for (const [, attributes] of html.matchAll(/<script\b([^>]*)>/g)) {
    const type = /\btype="([^"]*)"/.exec(attributes)?.[1];
    if (!/\bsrc=/.test(attributes) && !DATA_SCRIPTS.has(type)) fail("an inline script");
  }

  // The theme is the reader's, set by boot.js; a page must never ship one.
  if (/<html\b[^>]*\b(data-theme|class)=/.test(html)) fail("a theme baked into <html>");
  if (!html.includes('<script src="/boot.js"></script>')) fail("no boot.js");

  const canonicals = html.match(/<link rel="canonical"/g)?.length ?? 0;
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map(
    ([, hreflang]) => hreflang,
  );
  if (file === "404.html") {
    if (canonicals || hreflangs.length || /property="og:(url|locale)/.test(html))
      fail("names an address, though it answers for every unknown one");
    continue;
  }
  // A file under pl/ is the Polish page, any other the English one.
  const language = file.startsWith("pl/") ? "pl" : "en";
  if (!html.includes(`<html lang="${language}">`)) fail(`not <html lang="${language}">`);
  if (canonicals !== 1) fail(`${canonicals} canonical links`);
  const complete = hreflangs.join() === HREFLANGS.join();
  const oneLanguagePiece =
    hreflangs.length === 0 && /(^|\/)workshop\/[^/]+\/index\.html$/.test(file);
  if (!complete && !oneLanguagePiece) fail(`alternates ${JSON.stringify(hreflangs)}`);
}

// Every address the sitemap lists has its file, and so does 404.html. A file
// the sitemap leaves out is only the other language of a one-language piece,
// whose canonical names the page that is listed.
const sitemap = await readFile(path.join(dist, "sitemap.xml"), "utf8");
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => {
  const { pathname } = new URL(loc);
  return pathname === "/" ? "index.html" : `${pathname.slice(1)}/index.html`;
});
if (listed.length === 0) problems.push("sitemap.xml lists no address");
for (const file of [...listed, "404.html"]) {
  if (!files.includes(file)) problems.push(`${file}: missing`);
}
for (const file of files.filter((name) => name !== "404.html" && !listed.includes(name))) {
  const html = await readFile(path.join(dist, file), "utf8");
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  const own = `/${file.replace(/(^|\/)index\.html$/, "")}`;
  if (!canonical || new URL(canonical).pathname === own)
    problems.push(`${file}: a page the sitemap does not list`);
}
if (problems.length) {
  console.error(`check-dist: ${problems.length} problem(s)\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`check-dist: ${files.length} HTML files OK`);
