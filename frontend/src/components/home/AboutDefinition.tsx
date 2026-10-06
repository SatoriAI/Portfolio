import { Fragment } from "react";

export type AboutDefinitionLabels = {
  /** "Definicja." — set as the hero's "Twierdzenie." is. */
  label: string;
  /** The defining sentence; `{name}` is replaced with the name, in italics. */
  sentence: string;
  name: string;
  /**
   * A few sentences in the first person, set off by a rule as my own words;
   * `{book}` is replaced with the book's title, in italics.
   */
  body: string;
  book: string;
  /** The properties under the definition, numbered (i), (ii), … */
  properties: readonly { key: string; value: string }[];
};

/** Roman numerals for the properties, as a paper numbers them. */
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi"];

/**
 * "About me" as a definition, the way the hero is a theorem and its proof:
 * the label, one sentence that defines, the name in italics as a defined
 * term is set, then the story in my own words, upright beside a rule, so
 * the move from the definition's third person to the first reads as me
 * speaking, and the properties under it, numbered (i), (ii), …, each a key and
 * its value.
 */
const AboutDefinition = ({ labels }: { labels: AboutDefinitionLabels }) => (
  <div>
    <p className="mb-2 text-lg font-semibold text-iris">{labels.label}</p>
    <p className="text-pretty text-base text-foreground md:text-body-lg">
      {labels.sentence.split("{name}").map((part, at) => (
        <Fragment key={at}>
          {at > 0 && <em>{labels.name}</em>}
          {part}
        </Fragment>
      ))}
    </p>
    <blockquote className="mt-2 text-pretty border-l-2 border-iris pl-5 text-base text-muted-foreground md:text-body-lg">
      {labels.body.split("{book}").map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <cite>{labels.book}</cite>}
          {part}
        </Fragment>
      ))}
    </blockquote>
    <ol className="mt-4 space-y-2">
      {labels.properties.map((property, at) => (
        <li key={property.key} className="flex gap-4 text-base text-muted-foreground">
          <span className="w-11 shrink-0 text-iris">({ROMAN[at]})</span>
          <span>
            <span className="text-foreground">{property.key}:</span> {property.value}
          </span>
        </li>
      ))}
    </ol>
  </div>
);

export default AboutDefinition;
