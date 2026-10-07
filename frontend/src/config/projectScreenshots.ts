import type { Language } from "@/utils/translations";

/**
 * A real screenshot of each project, keyed by the project's title as the
 * backend gives it, shown in the project's browser frame on the home page and
 * revealed when the live check of its address comes back. A project without
 * one shows a short band with its app icon and one-line description instead.
 *
 * Screenshots live in `public/projects/` as WebP at 1280 × 720 (16:9): real
 * captures of the running site at a 1600px-wide window, nothing staged or
 * mocked up; crop only to keep a cookie banner out. This site's own is a
 * capture of its home page at a 1280px-wide window, one per language, since
 * the page it sits on is in one language and its public address still serves
 * the previous version until this one is deployed. Retake it when the top of
 * the home page changes.
 */
const SCREENSHOTS: Readonly<Record<string, string | Readonly<Record<Language, string>>>> = {
  tURL: "/projects/turl.webp",
  OpenGrant: "/projects/opengrant.webp",
  Konfio: "/projects/konfio.webp",
  Athlo: "/projects/athlo.webp",
  AdLume: "/projects/adlume.webp",
  Portfolio: { pl: "/projects/portfolio.pl.webp", en: "/projects/portfolio.en.webp" },
  Picko: "/projects/picko.webp",
  Slip: "/projects/slip.webp",
};

/** Each project's screenshot for a page in this language. */
export const screenshotsFor = (language: Language): Readonly<Record<string, string>> =>
  Object.fromEntries(
    Object.entries(SCREENSHOTS).map(([title, shot]) => [
      title,
      typeof shot === "string" ? shot : shot[language],
    ]),
  );
