import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UiSkill } from "@/lib/skillsService";

type SkillCardProps = {
  skill: UiSkill;
  className?: string;
};

const SkillCard = ({ skill, className }: SkillCardProps) => {
  const Icon = skill.icon;
  return (
    <Card className={className}>
      <CardHeader className="gap-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-lavender text-iris"
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <CardTitle>{skill.name}</CardTitle>
          {skill.level && <Badge variant="blush">{skill.level}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground">{skill.description}</p>
      </CardContent>
    </Card>
  );
};

export default SkillCard;
