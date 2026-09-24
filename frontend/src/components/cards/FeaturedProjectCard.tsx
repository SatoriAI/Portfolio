import { ProjectBody, type ProjectLabels, ProjectMedia } from "@/components/cards/projectCardParts";
import { Card } from "@/components/ui/card";
import { projectPrimaryHref } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

type FeaturedProjectCardProps = {
  project: UiProject;
  labels: ProjectLabels;
  className?: string;
};

/**
 * The lead project, image beside text across the full content width.
 *
 * The card carries no interior gutter, so its seam falls on the centreline of
 * the page grid's 708..732 gutter rather than on a column edge. That is correct
 * for a gutterless surface: there is no 12-column span that reaches 732 from
 * inside a padding-free card, and the eye reads a gutter as a single line.
 *
 * The media panel stretches to the body rather than setting a minimum height,
 * so the card is exactly as tall as its content.
 */
const FeaturedProjectCard = ({ project, labels, className }: FeaturedProjectCardProps) => (
  <Card
    interactive={Boolean(projectPrimaryHref(project))}
    className={cn("group flex flex-col md:grid md:grid-cols-2", className)}
  >
    <ProjectMedia
      project={project}
      labels={labels}
      corners="left"
      className="md:aspect-auto md:h-full"
    />
    <ProjectBody project={project} labels={labels} />
  </Card>
);

export default FeaturedProjectCard;
