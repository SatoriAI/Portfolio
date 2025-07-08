
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/components/ProjectCard';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Projects = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language } = useSettings();
  const t = translations[language];

  const projects = [
    {
      title: "Intelligent Document RAG System",
      description: "Built a sophisticated RAG pipeline for document analysis using vector embeddings and LLMs",
      technologies: ["Python", "LangChain", "ChromaDB", "OpenAI"],
      github: "#",
      demo: "#",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop"
    },
    {
      title: "Scalable Backend Architecture",
      description: "Designed and implemented microservices architecture handling 1M+ requests daily",
      technologies: ["Python", "FastAPI", "PostgreSQL", "Redis"],
      github: "#",
      demo: "#",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop"
    },
    {
      title: "Infrastructure Automation Suite",
      description: "Created comprehensive DevOps pipeline with automated testing and deployment",
      technologies: ["Python", "Terraform", "AWS", "Docker"],
      github: "#",
      demo: "#",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-40 border-b border-white/10 dark:border-white/10 border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Your Name
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="hover:text-blue-400 transition-colors">Home</a>
              <a href="/about" className="hover:text-blue-400 transition-colors">About</a>
              <a href="/skills" className="hover:text-blue-400 transition-colors">Skills</a>
              <a href="/projects" className="text-blue-400">Projects</a>
              <a href="/experience" className="hover:text-blue-400 transition-colors">Experience</a>
              <a href="/academic" className="hover:text-blue-400 transition-colors">Academic</a>
              <a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              {t.projects.title}
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300 text-muted-foreground max-w-2xl mx-auto">
              A showcase of my latest work in backend development, AI/ML, and infrastructure
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Projects;
