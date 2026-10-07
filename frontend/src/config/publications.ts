/**
 * What the backend does not carry about each paper and that does not change
 * with the language: who wrote it, and whether it has been published in a
 * journal or is a preprint. Keyed by the link the backend stores for the
 * paper, as the summaries in translations are.
 */
export type PublicationStatus = "published" | "preprint";

export type PublicationDetails = {
  authors: readonly string[];
  status: PublicationStatus;
};

export const publicationDetails: Record<string, PublicationDetails> = {
  "https://doi.org/10.1016/j.jat.2023.105921": {
    authors: ["Dawid Hanrahan", "Dariusz Kosz"],
    status: "published",
  },
  "https://arxiv.org/abs/2411.15793": {
    authors: ["Dawid Hanrahan"],
    status: "preprint",
  },
};
