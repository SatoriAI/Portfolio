import { Calendar, GraduationCap } from "lucide-react";

import CardMasthead from "@/components/cards/CardMasthead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UiSchool } from "@/lib/schoolsService";

type SchoolCardProps = {
  school: UiSchool;
  labels: { researchFocus: string; advisor: string; researchAreas: string };
  className?: string;
};

const SchoolCard = ({ school, labels, className }: SchoolCardProps) => (
  <Card className={className}>
    <CardHeader className="gap-3">
      <CardMasthead
        title={
          <>
            <CardTitle>{school.study}</CardTitle>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-iris">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span>{school.university}</span>
              {school.degree && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{school.degree}</span>
                </>
              )}
            </p>
          </>
        }
        meta={
          school.period && (
            <p className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {school.period}
            </p>
          )
        }
      />
    </CardHeader>
    <CardContent className="space-y-6">
      {school.research && (
        <div>
          <h4 className="mb-2 text-base">{labels.researchFocus}</h4>
          <p className="text-muted-foreground">{school.research}</p>
        </div>
      )}
      {school.advisor && (
        <div>
          <h4 className="mb-2 text-base">{labels.advisor}</h4>
          <p className="text-muted-foreground">{school.advisor}</p>
        </div>
      )}
      {school.areas.length > 0 && (
        <div>
          <h4 className="mb-3 text-base">{labels.researchAreas}</h4>
          <ul className="flex flex-wrap gap-2">
            {school.areas.map((area) => (
              <li key={area}>
                <Badge>{area}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);

export default SchoolCard;
