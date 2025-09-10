import { useState, useEffect } from 'react';
import { Building, Calendar, MapPin, Settings, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';
import { UiExperience, useExperiences } from '@/lib/experiencesService';

const Experience = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [experiences, setExperiences] = useState<UiExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();
  const t = translations[language];
  const experiencesService = useExperiences();

  useEffect(() => {
    const loadExperiences = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await experiencesService.fetch();
        setExperiences(data);
      } catch (err) {
        console.error('Failed to fetch experiences:', err);
        setError('Failed to load work experience data');
      } finally {
        setLoading(false);
      }
    };

    loadExperiences();
  }, [language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 w-full bg-orange-100/80 dark:bg-black/20 backdrop-blur-md z-40 border-b border-orange-200/50 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Dawid Hanrahan
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="hover:text-orange-600 dark:hover:text-purple-400 transition-colors py-2">{t.nav.home}</Link>
              <span className="text-orange-600 dark:text-purple-400 py-2 cursor-default">{t.nav.experience}</span>
              <Link to="/academic" className="hover:text-orange-600 dark:hover:text-purple-400 transition-colors py-2">{t.nav.academic}</Link>
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

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400 mx-auto mb-6 flex items-center justify-center">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              {t.experience.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.experience.subtitle}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-purple-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 dark:text-red-400 text-lg">{t.experience.error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                {t.experience.tryAgain}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {experiences.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">{t.experience.noData}</p>
                </div>
              ) : (
                experiences.map((exp) => (
                  <Card key={exp.id} className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10 hover:bg-orange-100/50 dark:hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-card-foreground text-2xl mb-2">
                        {exp.position}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-orange-600 dark:text-purple-400 mb-2">
                        <Building className="w-5 h-5" />
                        <span className="text-lg font-semibold">{exp.company}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:text-right">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{exp.period}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground text-base leading-relaxed">
                    {exp.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-card-foreground font-semibold mb-3">{t.experience.keyAchievements}</h4>
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-orange-600 dark:text-purple-400 mt-1">•</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-card-foreground font-semibold mb-3">{t.experience.technologies}</h4>
                      <div className="flex flex-wrap gap-2">
                        {exp.technologies.map((tech, i) => (
                          <Badge key={i} variant="secondary" className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 border-orange-400/30 dark:from-purple-500/20 dark:to-blue-500/20 dark:text-purple-300 dark:border-purple-400/30 text-center">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Experience;
