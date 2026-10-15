import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const content = fileURLToPath(new URL("../content", import.meta.url));

/**
 * The site's Markdown that Vex reads, keyed by its path under src/content
 * (`workshop/heat.en.md`), for vexBundle. Node only: the build reads it here
 * (vite.config.ts).
 */
export const readVexContent = async (): Promise<Record<string, string>> => {
  const files: Record<string, string> = {};
  for (const folder of ["projects", "workshop"]) {
    for (const name of await readdir(path.join(content, folder))) {
      if (name.endsWith(".md")) {
        files[`${folder}/${name}`] = await readFile(path.join(content, folder, name), "utf8");
      }
    }
  }
  return files;
};
