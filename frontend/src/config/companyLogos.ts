/**
 * Each company's logo for its circle on the experience timeline, keyed by the
 * company name the backend stores. The files are small crops in
 * `public/logos/`, cut so the mark reads at the circle's 40–56px: a square
 * icon where the company has one, the mark alone where the full logo carries
 * a wordmark too small to read. Each file is cut with the mark's bounding box
 * in its exact centre, so the circle, which centres the file, centres the
 * mark. A company without an entry keeps its
 * initials.
 */
export type CompanyLogo = {
  src: string;
  /** What shows round the logo inside the circle. */
  background: string;
  /** How much of the circle's width the logo takes, 0–1. */
  scale: number;
  /** A picture behind the logo instead of a flat colour, filling the circle. */
  backdrop?: string;
};

export const companyLogos: Record<string, CompanyLogo> = {
  "Nokia Solutions and Networks": {
    // Nokia has only a wordmark: the white letters alone, set across the
    // circle on Nokia's gradient with the letters taken out of it. Two
    // separate files, so no copy of the gradient shows at a second scale.
    src: "/logos/nokia-mark.png",
    background: "#1f5fd8",
    scale: 0.8,
    backdrop: "/logos/nokia-backdrop.jpg",
  },
  PeakData: { src: "/logos/peakdata.png", background: "#2C2646", scale: 0.86 },
  Xperi: { src: "/logos/xperi.jpg", background: "#ffffff", scale: 0.82 },
  CloudFerro: { src: "/logos/cloudferro.jpg", background: "#ffffff", scale: 0.74 },
  PwC: { src: "/logos/pwc.png", background: "#ffffff", scale: 0.76 },
  Addepto: { src: "/logos/addepto.png", background: "#ffffff", scale: 0.6 },
};
