
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
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-white text-xl">{skill.name}</CardTitle>
        <Badge 
          variant="secondary" 
          className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 text-blue-300 border-blue-400/30"
        >
          {skill.level}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 text-center text-sm leading-relaxed">
          {skill.description}
        </p>
      </CardContent>
    </Card>
  );
};

export default SkillCard;
