import AliasingFigure from "@/components/workshop/AliasingFigure";
import CovarianceFigure from "@/components/workshop/CovarianceFigure";
import {
  AverageOfProduct,
  type ExhibitLabels,
  HeatIdentity,
  SearchBars,
} from "@/components/workshop/exhibits";
import GrokkingThumbnail from "@/components/workshop/GrokkingThumbnail";

/** Each piece's exhibit by the name its header gives as `figure`. */
export const EXHIBITS: Record<string, (labels: ExhibitLabels) => JSX.Element> = {
  grokking: (labels) => <GrokkingThumbnail labels={labels} />,
  search: (labels) => <SearchBars labels={labels} />,
  heat: (labels) => <HeatIdentity labels={labels} />,
  averages: (labels) => <AverageOfProduct labels={labels} />,
};

/**
 * Figures a piece's text sets by name, `![…](/figure/aliasing "Caption")`,
 * that illustrate an idea rather than show a result, and that the reader
 * operates. They are never a piece's `figure`: the lists show still drawings.
 * The text frames them as illustrations (see FigureFrame).
 */
export const ILLUSTRATIONS: Record<string, (labels: ExhibitLabels) => JSX.Element> = {
  aliasing: (labels) => <AliasingFigure labels={labels.aliasing} />,
  covariance: (labels) => <CovarianceFigure labels={labels.covariance} />,
};
