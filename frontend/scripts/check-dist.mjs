// Run after `vite build`: checks the HTML the build wrote, which no unit test
// sees. Every page must name its language and its canonical address, and its
// alternates in both languages and x-default (a workshop piece written in one
// language only has none); 404.html must name no address at all; and no file
// may carry a script that runs from inline, which the site's policy
// (script-src 'self') would block in production while it works locally.
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

  const canonicals = html.match(/<link rel="canonical"/g)?.length ?? 0;
  const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map(
    ([, hreflang]) => hreflang,
  );
  if (file === "404.html") {
    if (canonicals || hreflangs.length || /property="og:(url|locale)/.test(html))
      fail("names an address, though it answers for every unknown one");
    continue;
  }
  if (!/<html lang="(en|pl)">/.test(html)) fail("no html lang");
  if (canonicals !== 1) fail(`${canonicals} canonical links`);
  const complete = hreflangs.join() === HREFLANGS.join();
  const oneLanguagePiece =
    hreflangs.length === 0 && /(^|\/)workshop\/[^/]+\/index\.html$/.test(file);
  if (!complete && !oneLanguagePiece) fail(`alternates ${JSON.stringify(hreflangs)}`);
}

if (files.length < 2) problems.push(`only ${files.length} HTML files in ${dist}`);
if (problems.length) {
  console.error(`check-dist: ${problems.length} problem(s)\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`check-dist: ${files.length} HTML files OK`);
