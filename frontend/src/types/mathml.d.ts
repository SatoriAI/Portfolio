import "react";

/**
 * React 18's types know no MathML. These are the elements the Formula
 * component renders; browsers implement them natively (MathML Core).
 */
type MathMLProps = React.HTMLAttributes<HTMLElement> & {
  display?: "inline" | "block";
  stretchy?: "true" | "false";
  lspace?: string;
  rspace?: string;
  /** MathML Core keeps only "normal": an upright single-letter identifier. */
  mathvariant?: "normal";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      mrow: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      mi: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      mn: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      mo: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      mtext: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      msub: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      msup: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
      mfrac: React.DetailedHTMLProps<MathMLProps, HTMLElement>;
    }
  }
}
