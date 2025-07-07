
import { useState } from 'react';
import { GraduationCap, BookOpen, Quote, ExternalLink, Settings, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';

const Academic = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language } = useSettings();
  const t = translations[language];

  const publications = [
    {
      title: "Advanced Techniques in Algebraic Topology: Applications to Data Analysis",
      journal: "Journal of Mathematical Sciences",
      year: "2023",
      type: "Research Paper",
      url: "#",
      abstract: "This paper explores novel applications of algebraic topology methods in high-dimensional data analysis, providing new insights into persistent homology algorithms."
    },
    {
      title: "Machine Learning Approaches to Topological Data Analysis",
      journal: "International Conference on Mathematical Computing",
      year: "2023",
      type: "Conference Paper",
      url: "#",
      abstract: "We present a framework combining traditional topological methods with modern machine learning techniques for enhanced pattern recognition."
    },
    {
      title: "Computational Methods in Modern Algebra",
      journal: "Mathematical Reviews Quarterly",
      year: "2022",
      type: "Review Article",
      url: "#",
      abstract: "A comprehensive review of computational approaches to solving complex algebraic problems, with emphasis on algorithmic efficiency."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      course: "Advanced Mathematics",
      semester: "Fall 2023",
      rating: 5,
      text: "Exceptional teaching style! Complex mathematical concepts were explained clearly and patiently. The practical examples really helped bridge theory and application."
    },
    {
      name: "Michael Rodriguez",
      course: "Linear Algebra",
      semester: "Spring 2023",
      rating: 5,
      text: "Best mathematics instructor I've had. The combination of theoretical depth and real-world applications made the subject fascinating and accessible."
    },
    {
      name: "Emma Johnson",
      course: "Mathematical Analysis",
      semester: "Fall 2022",
      rating: 5,
      text: "Outstanding mentor and teacher. Always available for questions and provided excellent guidance on research projects. Highly recommend!"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
    ));
  };

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
              <a href="/experience" className="hover:text-blue-400 transition-colors">Experience</a>
              <a href="/academic" className="text-blue-400">Academic</a>
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
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 mx-auto mb-6 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Academic Journey
            </h1>
            <p className="text-xl text-gray-300 dark:text-gray-300 text-muted-foreground max-w-3xl mx-auto">
              Currently pursuing PhD in Mathematics, focusing on algebraic topology and its applications to data science. 
              Passionate about teaching and research in computational mathematics.
            </p>
          </div>

          {/* PhD Information */}
          <section className="mb-20">
            <Card className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border">
              <CardHeader>
                <CardTitle className="text-white dark:text-white text-card-foreground text-3xl flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-purple-400" />
                  PhD in Mathematics
                </CardTitle>
                <CardDescription className="text-gray-300 dark:text-gray-300 text-muted-foreground text-lg">
                  University Name • Expected 2025
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Research Focus:</h4>
                    <p className="text-gray-300">
                      Algebraic Topology and Applications to Data Analysis - Developing novel computational methods 
                      for topological data analysis and persistent homology with applications in machine learning and data science.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Advisor:</h4>
                    <p className="text-gray-300">Prof. Dr. Mathematics Expert</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Research Areas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Algebraic Topology", "Topological Data Analysis", "Computational Mathematics", "Machine Learning Theory", "Persistent Homology"].map((area, i) => (
                        <Badge key={i} variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-purple-400/30">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Publications */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Publications
            </h2>
            <div className="space-y-6">
              {publications.map((pub, index) => (
                <Card key={index} className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-white dark:text-white text-card-foreground text-xl mb-2 flex items-start gap-3">
                          <BookOpen className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                          {pub.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-3">
                          <span className="font-medium">{pub.journal}</span>
                          <span>•</span>
                          <span>{pub.year}</span>
                          <Badge variant="outline" className="border-purple-400/30 text-purple-300">
                            {pub.type}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-purple-400/30 hover:border-purple-400">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <CardDescription className="text-gray-300 dark:text-gray-300 text-muted-foreground">
                      {pub.abstract}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* Student Testimonials */}
          <section>
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Student Testimonials
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/5 dark:bg-white/5 bg-card border-white/10 dark:border-white/10 border-border hover:bg-white/10 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <Quote className="w-6 h-6 text-purple-400" />
                      <div className="flex">{renderStars(testimonial.rating)}</div>
                    </div>
                    <CardTitle className="text-white dark:text-white text-card-foreground text-lg">
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription className="text-gray-300 dark:text-gray-300 text-muted-foreground">
                      {testimonial.course} • {testimonial.semester}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Academic;
