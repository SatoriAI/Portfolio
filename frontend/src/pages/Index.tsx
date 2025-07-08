
import { useState } from 'react';
import { MessageSquare, Github, Linkedin, Mail, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatWidget from '@/components/ChatWidget';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
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
              <a href="/" className="text-blue-400">Home</a>
              <a href="/about" className="hover:text-blue-400 transition-colors">About</a>
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

          {/* Quick Navigation */}
          <div className="mt-16 grid md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <a href="/about" className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:scale-105">
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400">About</h3>
              <p className="text-gray-400 text-sm">Learn more about me</p>
            </a>
            <a href="/skills" className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:scale-105">
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400">Skills</h3>
              <p className="text-gray-400 text-sm">Technical expertise</p>
            </a>
            <a href="/projects" className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:scale-105">
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400">Projects</h3>
              <p className="text-gray-400 text-sm">My latest work</p>
            </a>
            <a href="/experience" className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:scale-105">
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400">Experience</h3>
              <p className="text-gray-400 text-sm">Work history</p>
            </a>
            <a href="/academic" className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:scale-105">
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400">Academic</h3>
              <p className="text-gray-400 text-sm">PhD & publications</p>
            </a>
            <a href="/contact" className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-6 transition-all duration-300 hover:scale-105">
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400">Contact</h3>
              <p className="text-gray-400 text-sm">Get in touch</p>
            </a>
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
