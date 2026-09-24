import { Building, Calendar, MapPin } from "lucide-react";

import CardMasthead from "@/components/cards/CardMasthead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UiExperience } from "@/lib/experiencesService";

type ExperienceCardProps = {
  experience: UiExperience;
  labels: { keyAchievements: string; technologies: string };
  className?: string;
};

const ExperienceCard = ({ experience, labels, className }: ExperienceCardProps) => (
  <Card className={className}>
    <CardHeader className="gap-4">
      <CardMasthead
        title={
          <>
            <CardTitle>{experience.position}</CardTitle>
            <p className="mt-2 flex items-center gap-2 font-medium text-iris">
              <Building className="h-4 w-4" aria-hidden="true" />
              {experience.company}
            </p>
          </>
        }
        meta={
          <>
            <p className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {experience.period}
            </p>
            {experience.location && (
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {experience.location}
              </p>
            )}
          </>
        }
      />
      {experience.description && (
        <CardDescription className="md:text-body-lg">{experience.description}</CardDescription>
      )}
    </CardHeader>
    <CardContent className="space-y-6">
      {experience.achievements.length > 0 && (
        <div>
          <h4 className="mb-3 text-base">{labels.keyAchievements}</h4>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground marker:text-iris">
            {experience.achievements.map((achievement) => (
              <li key={achievement}>{achievement}</li>
            ))}
          </ul>
        </div>
      )}
      {experience.technologies.length > 0 && (
        <div>
          <h4 className="mb-3 text-base">{labels.technologies}</h4>
          <ul className="flex flex-wrap gap-2">
            {experience.technologies.map((tech) => (
              <li key={tech}>
                <Badge>{tech}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ExperienceCard;
