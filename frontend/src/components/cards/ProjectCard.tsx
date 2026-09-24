import { ProjectBody, type ProjectLabels, ProjectMedia } from "@/components/cards/projectCardParts";
import { Card } from "@/components/ui/card";
import { projectPrimaryHref } from "@/lib/projectLinks";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: UiProject;
  labels: ProjectLabels;
  className?: string;
};

/**
 * One project, image over text. The whole card is a target when the project has
 * somewhere to go, which is what earns it the hover lift — the kit allows motion
 * or elevation to imply interactivity "only when the whole card is actionable".
 *
 * The wide first project is {@link FeaturedProjectCard}; it is a second
 * component rather than a `featured` flag because it restructures the markup.
 */
const ProjectCard = ({ project, labels, className }: ProjectCardProps) => (
  <Card
    interactive={Boolean(projectPrimaryHref(project))}
    className={cn("group flex h-full flex-col", className)}
  >
    <ProjectMedia project={project} labels={labels} corners="top" />
    <ProjectBody project={project} labels={labels} />
  </Card>
);

export default ProjectCard;
