
import { useState } from 'react';
import { MessageSquare, Github, Linkedin, Mail, Settings, User, Code, Database, Brain, Server, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChatWidget from '@/components/ChatWidget';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHomeDropdownOpen, setIsHomeDropdownOpen] = useState(false);
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsHomeDropdownOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsHomeDropdownOpen(false);
  };

  const handleHomeAreaEnter = () => {
    setIsHomeDropdownOpen(true);
  };

  const handleHomeAreaLeave = () => {
    setIsHomeDropdownOpen(false);
  };

  const handleDropdownItemClick = (sectionId: string) => {
    scrollToSection(sectionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 w-full bg-orange-100/80 dark:bg-black/20 backdrop-blur-md z-40 border-b border-orange-200/50 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
            Your Name
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex space-x-8">
              <div 
                className="relative"
                onMouseEnter={handleHomeAreaEnter}
                onMouseLeave={handleHomeAreaLeave}
              >
                <button 
                  onClick={scrollToTop}
                  className="text-orange-600 hover:text-orange-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors py-2"
                >
                  Home
                </button>
                {isHomeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-0 bg-orange-50/95 dark:bg-black/95 backdrop-blur-md border border-orange-200/50 dark:border-white/10 rounded-lg shadow-lg py-2 min-w-[120px] z-50">
                    <button
                      onClick={() => handleDropdownItemClick('about')}
                      className="block w-full text-left px-4 py-2 text-orange-800 hover:text-orange-600 hover:bg-orange-100/50 dark:text-white dark:hover:text-blue-400 dark:hover:bg-white/10 transition-colors"
                    >
                      About
                    </button>
                    <button
                      onClick={() => handleDropdownItemClick('skills')}
                      className="block w-full text-left px-4 py-2 text-orange-800 hover:text-orange-600 hover:bg-orange-100/50 dark:text-white dark:hover:text-blue-400 dark:hover:bg-white/10 transition-colors"
                    >
                      Skills
                    </button>
                    <button
                      onClick={() => handleDropdownItemClick('projects')}
                      className="block w-full text-left px-4 py-2 text-orange-800 hover:text-orange-600 hover:bg-orange-100/50 dark:text-white dark:hover:text-blue-400 dark:hover:bg-white/10 transition-colors"
                    >
                      Projects
                    </button>
                    <button
                      onClick={() => handleDropdownItemClick('contact')}
                      className="block w-full text-left px-4 py-2 text-orange-800 hover:text-orange-600 hover:bg-orange-100/50 dark:text-white dark:hover:text-blue-400 dark:hover:bg-white/10 transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                )}
              </div>
              <a href="/experience" className="hover:text-orange-600 dark:hover:text-blue-400 transition-colors py-2">Experience</a>
              <a href="/academic" className="hover:text-orange-600 dark:hover:text-blue-400 transition-colors py-2">Academic</a>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full hover:bg-orange-100/50 dark:hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-blue-400 dark:to-teal-400 mx-auto mb-6 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 dark:from-blue-400 dark:via-teal-400 dark:to-blue-400 bg-clip-text text-transparent animate-fade-in">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-blue-500 dark:to-teal-500 dark:hover:from-blue-600 dark:hover:to-teal-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {t.hero.askAI}
            </Button>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="rounded-full border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400">
                <Github className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400">
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
              {t.about.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t.about.paragraph1}
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t.about.paragraph2}
              </p>
            </div>
            <Card className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-card-foreground">{t.about.philosophy}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
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
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
              {t.skills.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              My technical expertise and core competencies in software development
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map((skill, index) => (
              <Card key={index} className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10 hover:bg-orange-100/50 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-400 dark:from-blue-400 dark:to-teal-400 rounded-full flex items-center justify-center">
                    <skill.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-card-foreground">{skill.name}</CardTitle>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-700 border-orange-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
                    {skill.level}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    {skill.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
              {t.projects.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A showcase of my latest work in backend development, AI/ML, and infrastructure
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <Card key={index} className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10 hover:bg-orange-100/50 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-orange-400 to-red-400 dark:from-blue-400 dark:to-teal-400 relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-card-foreground">{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="bg-orange-500/20 text-orange-700 border-orange-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400">
                      <Github className="w-4 h-4 mr-2" />
                      Code
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
              {t.contact.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Let's connect and discuss how we can work together
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <Card className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    {t.contact.email}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    your.email@example.com
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    github.com/yourusername
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    linkedin.com/in/yourprofile
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  {t.contact.quickMessage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t.contact.quickMessageDesc}
                </p>
                <Button 
                  onClick={() => setIsChatOpen(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-blue-500 dark:to-teal-500 dark:hover:from-blue-600 dark:hover:to-teal-600 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t.hero.askAI}
                </Button>
              </CardContent>
            </Card>
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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-blue-500 dark:to-teal-500 dark:hover:from-blue-600 dark:hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
};

export default Index;
