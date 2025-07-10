import { useState } from 'react';
import { Building, Calendar, MapPin, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Experience = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language } = useSettings();
  const t = translations[language];

  const experiences = [
    {
      company: "Tech Innovate Corp",
      position: "Senior Python Backend Developer",
      period: "2022 - Present",
      location: "Remote",
      description: "Leading the development of scalable microservices architecture handling 2M+ daily requests. Implemented advanced RAG pipelines for document processing and LLM integrations.",
      achievements: [
        "Architected and deployed ML-powered document analysis system",
        "Reduced API response time by 40% through optimization",
        "Led team of 5 developers in agile environment",
        "Implemented comprehensive testing strategy increasing coverage to 95%"
      ],
      technologies: ["Python", "FastAPI", "PostgreSQL", "Redis", "AWS", "Docker", "LangChain"]
    },
    {
      company: "DataFlow Solutions",
      position: "Backend Developer",
      period: "2020 - 2022",
      location: "San Francisco, CA",
      description: "Developed and maintained backend systems for data processing pipelines. Specialized in building APIs and database optimization for high-throughput applications.",
      achievements: [
        "Built ETL pipelines processing 500GB+ daily data",
        "Implemented real-time analytics dashboard backend",
        "Optimized database queries improving performance by 60%",
        "Collaborated with data science team on ML model deployment"
      ],
      technologies: ["Python", "Django", "MongoDB", "Celery", "ElasticSearch", "Kubernetes"]
    },
    {
      company: "StartupX",
      position: "Full Stack Developer",
      period: "2019 - 2020",
      location: "New York, NY",
      description: "Joined early-stage startup to build the initial product from ground up. Worked on both frontend and backend development while establishing development practices.",
      achievements: [
        "Built MVP from concept to deployment in 4 months",
        "Established CI/CD pipeline and development workflows",
        "Implemented user authentication and authorization system",
        "Mentored junior developers on best practices"
      ],
      technologies: ["Python", "Flask", "React", "PostgreSQL", "Heroku", "GitHub Actions"]
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
              <Link to="/" className="hover:text-blue-400 transition-colors py-2">Home</Link>
              <span className="text-blue-400 py-2 cursor-default">Experience</span>
              <Link to="/academic" className="hover:text-blue-400 transition-colors py-2">Academic</Link>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Work Experience
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300 text-muted-foreground max-w-2xl mx-auto">
              My professional journey in backend development, infrastructure, and AI/ML implementations
            </p>
          </div>

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <Card key={index} className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-white dark:text-white text-card-foreground text-2xl mb-2">
                        {exp.position}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Building className="w-5 h-5" />
                        <span className="text-lg font-semibold">{exp.company}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:text-right">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>{exp.period}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-gray-300 dark:text-gray-300 text-muted-foreground text-base leading-relaxed">
                    {exp.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3">Key Achievements:</h4>
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} className="text-gray-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-3">Technologies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {exp.technologies.map((tech, i) => (
                          <Badge key={i} variant="secondary" className="bg-gradient-to-r from-blue-500/20 to-teal-500/20 text-blue-300 border-blue-400/30">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Experience;
