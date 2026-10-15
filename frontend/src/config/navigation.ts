import type { translations } from "@/utils/translations";

type NavLabelKey = keyof (typeof translations)["en"]["nav"];

export type NavItem = {
  /** Key into `translations[lang].nav`. */
  labelKey: NavLabelKey;
  /** Router path; a hash targets a section on the home page. */
  to: string;
};

/** Sections of the home page, in page order. */
export const homeSections: readonly NavItem[] = [
  { labelKey: "projects", to: "/#projects" },
  { labelKey: "about", to: "/#about" },
  { labelKey: "contact", to: "/#contact" },
];

/** Standalone routes. The sitemap and the server's routes are built from these (lib/siteMap.ts). */
export const pages: readonly NavItem[] = [
  { labelKey: "experience", to: "/experience" },
  { labelKey: "academic", to: "/research" },
  { labelKey: "education", to: "/education" },
  { labelKey: "workshop", to: "/workshop" },
];

/** Old addresses, kept so shared links still land; each opens its page's current one. */
export const redirects: readonly { from: string; to: string }[] = [
  { from: "/academic", to: "/research" },
];
