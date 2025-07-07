
import { useState } from 'react';
import { MessageSquare, Github, Linkedin, Mail, ExternalLink, Code, Database, Brain, Server, Users, Book, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChatWidget from '@/components/ChatWidget';
import ProjectCard from '@/components/ProjectCard';
import SkillCard from '@/components/SkillCard';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language } = useSettings();
  
  const t = translations[language];

  const skills = [
    { icon: Code, name: "Python", level: "Expert", description: "Backend development, APIs, automation" },
    { icon: Database, name: "Databases", level: "Advanced", description: "PostgreSQL, MongoDB, Redis" },
    { icon: Brain, name: "LLMs & RAG", level: "Expert", description: "Pipeline development, vector databases" },
    { icon: Server, name: "Infrastructure", level: "Advanced", description: "AWS, Docker, Kubernetes" }
  ];

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
              <a href="#about" className="hover:text-blue-400 transition-colors">{t.nav.about}</a>
              <a href="#skills" className="hover:text-blue-400 transition-colors">{t.nav.skills}</a>
              <a href="#projects" className="hover:text-blue-400 transition-colors">{t.nav.projects}</a>
              <a href="#contact" className="hover:text-blue-400 transition-colors">{t.nav.contact}</a>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 mx-auto mb-6 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-teal-400 to-blue-400 bg-clip-text text-transparent animate-fade-in">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 dark:text-gray-300 text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t.hero.askAI}
            </Button>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="rounded-full border-gray-600 hover:border-blue-400">
                <Github className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-gray-600 hover:border-blue-400">
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-gray-600 hover:border-blue-400">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {t.about.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-300 dark:text-gray-300 text-muted-foreground mb-6 leading-relaxed">
                {t.about.paragraph1}
              </p>
              <p className="text-lg text-gray-300 dark:text-gray-300 text-muted-foreground mb-6 leading-relaxed">
                {t.about.paragraph2}
              </p>
            </div>
            <Card className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border">
              <CardHeader>
                <CardTitle className="text-white dark:text-white text-card-foreground">{t.about.philosophy}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 dark:text-gray-300 text-muted-foreground">
                <p>
                  {t.about.philosophyText}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {t.skills.title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <SkillCard key={index} skill={skill} />
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {t.projects.title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            {t.contact.title}
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-300 text-muted-foreground mb-8">
            {t.contact.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-8 py-3 rounded-full">
              <Mail className="w-5 h-5 mr-2" />
              {t.hero.getInTouch}
            </Button>
            <Button 
              onClick={() => setIsChatOpen(true)}
              variant="outline" 
              className="border-gray-600 hover:border-blue-400 px-8 py-3 rounded-full"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t.hero.chatWithAI}
            </Button>
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default Index;
