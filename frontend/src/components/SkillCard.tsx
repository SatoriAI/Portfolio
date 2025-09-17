import { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Skill {
  icon: LucideIcon;
  name: string;
  level: string;
  description: string;
}

interface SkillCardProps {
  skill: Skill;
}

const SkillCard = ({ skill }: SkillCardProps) => {
  const Icon = skill.icon;

  return (
    <Card className="group flex max-h-[320px] min-h-[280px] flex-col border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:scale-105 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
      <CardHeader className="flex flex-shrink-0 flex-col items-center justify-center text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-400 transition-transform duration-300 group-hover:scale-110 dark:from-blue-500 dark:to-teal-500">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="flex min-h-[1.5rem] items-center justify-center text-lg text-card-foreground">
          {skill.name}
        </CardTitle>
        <Badge
          variant="secondary"
          className="mt-2 justify-center border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:border-blue-400/30 dark:from-blue-500/20 dark:to-teal-500/20 dark:text-blue-300"
        >
          {skill.level}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-grow items-start justify-center px-4 pt-0">
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {skill.description}
        </p>
      </CardContent>
    </Card>
  );
};

export default SkillCard;
