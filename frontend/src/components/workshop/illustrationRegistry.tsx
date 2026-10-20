import AliasingFigure from "@/components/workshop/AliasingFigure";
import CovarianceFigure from "@/components/workshop/CovarianceFigure";
import type { ExhibitLabels } from "@/components/workshop/exhibits";

/**
 * Figures a piece's text sets by name, `![…](/figure/aliasing "Caption")`,
 * that illustrate an idea rather than show a result, and that the reader
 * operates. They are never a piece's `figure`: the lists show still drawings
 * (exhibitRegistry). Kept apart from those so that only the article page,
 * through ArticleBody, carries their code; the home page and the index,
 * which show the still drawings, never load it. The text frames them as
 * illustrations (see FigureFrame).
 */
export const ILLUSTRATIONS: Record<string, (labels: ExhibitLabels) => JSX.Element> = {
  aliasing: (labels) => <AliasingFigure labels={labels.aliasing} />,
  covariance: (labels) => <CovarianceFigure labels={labels.covariance} />,
};
