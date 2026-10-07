import { type ExhibitLabels, HeatIdentity, SearchBars } from "@/components/workshop/exhibits";
import GrokkingThumbnail from "@/components/workshop/GrokkingThumbnail";

/** Each piece's exhibit by the name its header gives as `figure`. */
export const EXHIBITS: Record<string, (labels: ExhibitLabels) => JSX.Element> = {
  grokking: (labels) => <GrokkingThumbnail labels={labels} />,
  search: (labels) => <SearchBars labels={labels} />,
  heat: (labels) => <HeatIdentity labels={labels} />,
};
