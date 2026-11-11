import { SymbolDrawing, WaveDrawing } from "@/components/workshop/AliasingFigure";
import CovarianceFigure from "@/components/workshop/CovarianceFigure";
import type { ExhibitLabels } from "@/components/workshop/exhibits";

/**
 * Figures a piece's text sets by name, `![…](/figure/wave "Caption")`,
 * that illustrate an idea rather than show a result. In a piece they are
 * drawings: nothing in a workshop piece is operated by the reader, so a
 * figure with a control gives its plots here at rest. They are never a piece's
 * `figure`: the lists show still drawings (exhibitRegistry). Kept apart from those so that only the article page,
 * through ArticleBody, carries their code; the home page and the index,
 * which show the still drawings, never load it. The text sets them in the
 * same card as any other drawing (see ArticleBody).
 */
export const ILLUSTRATIONS: Record<string, (labels: ExhibitLabels) => JSX.Element> = {
  wave: (labels) => <WaveDrawing labels={labels.aliasing} />,
  symbol: (labels) => <SymbolDrawing labels={labels.aliasing} />,
  covariance: (labels) => <CovarianceFigure labels={labels.covariance} />,
};
