/**
 * The site's two languages and where each lives: English at the plain
 * addresses (`/research`), Polish under `/pl` (`/pl/research`), the same
 * English words after the prefix. The address decides the language, so a
 * link, a crawler and a reload all see the same page; the app reads it once
 * at boot and hands the router `/pl` as its basename, so its own paths never
 * carry the prefix.
 */
export const LANGUAGES = ["en", "pl"] as const;
export type Language = (typeof LANGUAGES)[number];

/** The language x-default names, and the one the plain addresses carry. */
export const DEFAULT_LANGUAGE: Language = "en";

/** Matched in any case, as the router and the server match paths. */
const POLISH_PREFIX = /^\/pl(?=[/?#]|$)/i;

export const languageOf = (pathname: string): Language =>
  POLISH_PREFIX.test(pathname) ? "pl" : "en";

/** The router's basename for a language: none for English. */
export const languageBasename = (language: Language) => (language === "pl" ? "/pl" : undefined);

/** A site path without its language prefix: `/pl/research#x` is `/research#x`. */
export const stripLanguage = (path: string) => {
  const rest = path.replace(POLISH_PREFIX, "");
  return rest.startsWith("/") ? rest : `/${rest}`;
};

/**
 * A path within the language (`/research`, `/`, `/#projects`) as the
 * address in `language`. Home in Polish is `/pl`, without a trailing slash,
 * the one form its canonical takes too.
 */
export const localizedPath = (language: Language, path: string) => {
  if (language === "en") return path;
  return `/pl${path.replace(/^\/(?=[?#]|$)/, "")}`;
};

/**
 * A reader's explicit choice of language, made with the toggle. Kept apart
 * from the `language` key the site used to write on every visit, which
 * cannot tell a choice from a default.
 */
export const LANGUAGE_CHOICE_KEY = "languageChoice";

export const readLanguageChoice = (): Language | null => {
  try {
    const stored = localStorage.getItem(LANGUAGE_CHOICE_KEY);
    return LANGUAGES.find((language) => language === stored) ?? null;
  } catch {
    return null;
  }
};

export const storeLanguageChoice = (language: Language) => {
  try {
    localStorage.setItem(LANGUAGE_CHOICE_KEY, language);
  } catch {
    // Storage blocked: the choice holds for this visit, through the address.
  }
};

/**
 * Where the home page sends a reader before anything renders, or null to
 * stay. Only the English home page, only for a reader who has never chosen
 * a language and whose browser prefers Polish: every other address, and any
 * choice made with the toggle, is kept as it is. A crawler asks in English,
 * so it always reads the page it requested.
 */
export const autoLanguageRedirect = ({
  pathname,
  choice,
  browserLanguages,
}: {
  pathname: string;
  choice: Language | null;
  browserLanguages: readonly string[];
}): string | null => {
  if (pathname !== "/" || choice !== null) return null;
  return (browserLanguages[0] ?? "").toLowerCase().startsWith("pl") ? "/pl" : null;
};
