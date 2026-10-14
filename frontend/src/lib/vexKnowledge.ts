import { parseHeader, type WorkshopLanguage } from "./workshop";

/**
 * What Vex reads of the site's Markdown, one bundle per language, published
 * by the build as `/vex-kb/<language>.json` (see vite.config.ts). The backend
 * is built without the frontend's files, so it fetches these from the site
 * and puts them, whole, in Vex's prompt beside what the database holds.
 *
 * A source is one document: a project write-up (src/content/projects) or a
 * workshop piece (src/content/workshop), header included, since its lines
 * (period, status, stack, links) are facts Vex answers from. Each is given in
 * the reader's language where it exists, otherwise in the other one, as the
 * site shows it. Drafts and the projects' README are never included.
 */
export type VexSource = { path: string; title: string; text: string };
export type VexBundle = { language: WorkshopLanguage; sources: VexSource[] };

export const VEX_LANGUAGES: readonly WorkshopLanguage[] = ["pl", "en"];

/** Where each folder's documents are shown on the site. */
const PAGES = {
  projects: () => "/#projects",
  workshop: (slug: string) => `/workshop/${slug}`,
} as const;

type Folder = keyof typeof PAGES;

const FILE = /^(projects|workshop)\/([a-z0-9-]+)\.(pl|en)\.md$/;

/**
 * The bundle for `language` from the content files, keyed by their path
 * under src/content (`projects/slip.en.md`). Ordered by folder and then by
 * slug, so the same files always give the same bundle: Vex's prompt cache
 * holds only while its text is unchanged.
 */
export const vexBundle = (files: Record<string, string>, language: WorkshopLanguage): VexBundle => {
  const documents = new Map<
    string,
    { folder: Folder; slug: string; byLanguage: Map<string, string> }
  >();
  for (const [path, raw] of Object.entries(files)) {
    const match = FILE.exec(path);
    if (!match) continue;
    const [, folder, slug, fileLanguage] = match;
    const key = `${folder}/${slug}`;
    const document = documents.get(key) ?? {
      folder: folder as Folder,
      slug,
      byLanguage: new Map(),
    };
    document.byLanguage.set(fileLanguage, raw);
    documents.set(key, document);
  }
  const sources = [...documents.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, { folder, slug, byLanguage }]) => {
      const raw = byLanguage.get(language) ?? [...byLanguage.values()][0];
      return {
        path: PAGES[folder](slug),
        title: parseHeader(raw).header.title || slug,
        text: raw.trim(),
      };
    });
  return { language, sources };
};
