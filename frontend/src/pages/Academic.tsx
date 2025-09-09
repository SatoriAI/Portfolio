
import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Quote, ExternalLink, Settings, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SettingsPanel from '@/components/SettingsPanel';
import { useSettings } from '@/contexts/SettingsContext';
import { translations } from '@/utils/translations';
import { UiSchool, useSchools } from '@/lib/schoolsService';
import { UiPublication, usePublications } from '@/lib/publicationsService';
import { UiTestimonial, useTestimonials } from '@/lib/testimonialsService';

const Academic = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [publications, setPublications] = useState<UiPublication[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();
  const t = translations[language];
  const schoolsService = useSchools();
  const publicationsService = usePublications();
  const testimonialsService = useTestimonials();

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load schools, publications, and testimonials in parallel
        const [schoolsData, publicationsData, testimonialsData] = await Promise.all([
          schoolsService.fetch(),
          publicationsService.fetch(),
          testimonialsService.fetch()
        ]);
        
        setSchools(schoolsData);
        setPublications(publicationsData);
        setTestimonials(testimonialsData);
      } catch (err) {
        console.error('Failed to fetch academic data:', err);
        setError('Failed to load academic data');
      } finally {
        setLoading(false);
      }
    };

    loadAcademicData();
  }, [language]);



  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 w-full bg-orange-100/80 dark:bg-black/20 backdrop-blur-md z-40 border-b border-orange-200/50 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
            Dawid Hanrahan
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="hover:text-orange-600 dark:hover:text-blue-400 transition-colors">Home</a>
              <a href="/experience" className="hover:text-orange-600 dark:hover:text-blue-400 transition-colors">Experience</a>
              <a href="/academic" className="text-orange-600 dark:text-blue-400">Academic</a>
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
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400 mx-auto mb-6 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              {t.academic.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              {t.academic.subtitle}
            </p>
          </div>

          {/* Academic Information */}
          <section className="mb-20">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-purple-400"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 dark:text-red-400 text-lg">{t.academic.error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {t.academic.tryAgain}
                </Button>
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">{t.academic.noData}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {schools.map((school) => (
                  <Card key={school.id} className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10">
                    <CardHeader>
                      <CardTitle className="text-card-foreground text-3xl flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-orange-600 dark:text-purple-400" />
                        {school.study}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-lg">
                        {school.university} • {school.period}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {school.research && (
                          <div>
                            <h4 className="text-card-foreground font-semibold mb-2">{t.academic.researchFocus}</h4>
                            <p className="text-muted-foreground">
                              {school.research}
                            </p>
                          </div>
                        )}
                        {school.advisor && (
                          <div>
                            <h4 className="text-card-foreground font-semibold mb-2">{t.academic.advisor}</h4>
                            <p className="text-muted-foreground">{school.advisor}</p>
                          </div>
                        )}
                        {school.areas.length > 0 && (
                          <div>
                            <h4 className="text-card-foreground font-semibold mb-2">{t.academic.researchAreas}</h4>
                            <div className="flex flex-wrap gap-2">
                              {school.areas.map((area, i) => (
                                <Badge key={i} variant="secondary" className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 border-orange-400/30 dark:from-purple-500/20 dark:to-blue-500/20 dark:text-purple-300 dark:border-purple-400/30">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Publications */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              {t.academic.publications}
            </h2>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-purple-400"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 dark:text-red-400 text-lg">{t.academic.error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {t.academic.tryAgain}
                </Button>
              </div>
            ) : publications.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">{t.academic.noPublications}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {publications.map((pub) => (
                  <Card key={pub.id} className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10 hover:bg-orange-100/50 dark:hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-card-foreground text-xl mb-2 flex items-start gap-3">
                            <BookOpen className="w-6 h-6 text-orange-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                            {pub.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-3">
                            <span className="font-medium">{pub.journal}</span>
                            <span>•</span>
                            <span>{pub.year}</span>
                          </div>
                        </div>
                        {pub.link && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-orange-400/30 hover:border-orange-500 dark:border-purple-400/30 dark:hover:border-purple-400"
                            onClick={() => window.open(pub.link, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {t.academic.view}
                          </Button>
                        )}
                      </div>
                      {pub.summary && (
                        <CardDescription className="text-muted-foreground">
                          {pub.summary}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Student Testimonials */}
          <section>
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              {t.academic.studentTestimonials}
            </h2>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-purple-400"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 dark:text-red-400 text-lg">{t.academic.error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {t.academic.tryAgain}
                </Button>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">{t.academic.noTestimonials}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="bg-orange-50/50 dark:bg-white/5 border-orange-200/50 dark:border-white/10 hover:bg-orange-100/50 dark:hover:bg-white/10 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <Quote className="w-6 h-6 text-orange-600 dark:text-purple-400" />
                        <div className="flex">{renderStars(testimonial.rating)}</div>
                      </div>
                      <CardTitle className="text-card-foreground text-lg">
                        {testimonial.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {testimonial.course} • {testimonial.semester}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground italic leading-relaxed">
                        "{testimonial.text}"
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Academic;
