
import { ExternalLink, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Project {
  title: string;
  description: string;
  technologies: string[];
  github: string;
  demo: string;
  image: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={project.image} 
          alt={project.title}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <CardHeader>
        <CardTitle className="text-white text-xl">{project.title}</CardTitle>
        <CardDescription className="text-gray-300">
          {project.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
            >
              {tech}
            </Badge>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-gray-600 hover:border-blue-400 text-gray-300 hover:text-white"
          >
            <Github className="w-4 h-4 mr-2" />
            Code
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-gray-600 hover:border-teal-400 text-gray-300 hover:text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Demo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
