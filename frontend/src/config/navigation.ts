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
  { labelKey: "about", to: "/#about" },
  { labelKey: "skills", to: "/#skills" },
  { labelKey: "projects", to: "/#projects" },
  { labelKey: "contact", to: "/#contact" },
];

/** Standalone routes. */
export const pages: readonly NavItem[] = [
  { labelKey: "experience", to: "/experience" },
  { labelKey: "academic", to: "/academic" },
];
