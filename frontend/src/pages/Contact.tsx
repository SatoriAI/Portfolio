
import { useState } from 'react';
import { Settings, Mail, MessageSquare, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatWidget from '@/components/ChatWidget';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Contact = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
              <a href="/about" className="hover:text-blue-400 transition-colors">About</a>
              <a href="/skills" className="hover:text-blue-400 transition-colors">Skills</a>
              <a href="/projects" className="hover:text-blue-400 transition-colors">Projects</a>
              <a href="/experience" className="hover:text-blue-400 transition-colors">Experience</a>
              <a href="/academic" className="hover:text-blue-400 transition-colors">Academic</a>
              <a href="/contact" className="text-blue-400">Contact</a>
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
              {t.contact.title}
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300 text-muted-foreground mb-8">
              {t.contact.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border">
              <CardHeader>
                <CardTitle className="text-white dark:text-white text-card-foreground flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Get In Touch
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 dark:text-gray-300 text-muted-foreground">
                <p className="mb-4">
                  I'm always open to discussing new opportunities, interesting projects, or just having a chat about technology and mathematics.
                </p>
                <div className="flex flex-col gap-4">
                  <Button className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white">
                    <Mail className="w-5 h-5 mr-2" />
                    {t.hero.getInTouch}
                  </Button>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" size="icon" className="rounded-full border-gray-600 hover:border-blue-400">
                      <Github className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full border-gray-600 hover:border-blue-400">
                      <Linkedin className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border">
              <CardHeader>
                <CardTitle className="text-white dark:text-white text-card-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 dark:text-gray-300 text-muted-foreground">
                <p className="mb-4">
                  Have questions about my work, experience, or background? Chat with my AI assistant for instant answers about my portfolio and expertise.
                </p>
                <Button 
                  onClick={() => setIsChatOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {t.hero.chatWithAI}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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

export default Contact;
