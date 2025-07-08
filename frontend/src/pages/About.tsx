
import { useState } from 'react';
import { Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const About = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language } = useSettings();
  const t = translations[language];

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
              <a href="/about" className="text-blue-400">About</a>
              <a href="/skills" className="hover:text-blue-400 transition-colors">Skills</a>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 mx-auto mb-6 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              {t.about.title}
            </h1>
          </div>

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
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default About;
