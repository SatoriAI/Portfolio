
import { useState } from 'react';
import { Settings, Code, Database, Brain, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkillCard from '@/components/SkillCard';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Skills = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language } = useSettings();
  const t = translations[language];

  const skills = [
    { icon: Code, name: "Python", level: "Expert", description: "Backend development, APIs, automation" },
    { icon: Database, name: "Databases", level: "Advanced", description: "PostgreSQL, MongoDB, Redis" },
    { icon: Brain, name: "LLMs & RAG", level: "Expert", description: "Pipeline development, vector databases" },
    { icon: Server, name: "Infrastructure", level: "Advanced", description: "AWS, Docker, Kubernetes" }
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
              <a href="/skills" className="text-blue-400">Skills</a>
              <a href="/projects" className="hover:text-blue-400 transition-colors">Projects</a>
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
              {t.skills.title}
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300 text-muted-foreground max-w-2xl mx-auto">
              My technical expertise and core competencies in software development
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <SkillCard key={index} skill={skill} />
            ))}
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Skills;
