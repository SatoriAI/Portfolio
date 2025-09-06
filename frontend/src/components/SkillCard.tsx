
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <Card className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10 hover:bg-orange-100/50 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-blue-500 dark:to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-card-foreground text-xl">{skill.name}</CardTitle>
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 border-orange-400/30 dark:from-blue-500/20 dark:to-teal-500/20 dark:text-blue-300 dark:border-blue-400/30"
        >
          {skill.level}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center text-sm leading-relaxed">
          {skill.description}
        </p>
      </CardContent>
    </Card>
  );
};

export default SkillCard;
