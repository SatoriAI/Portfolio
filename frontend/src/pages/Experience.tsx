import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Building, Calendar, MapPin, Menu, Settings } from "lucide-react";

import Reveal from "@/components/Reveal";
import SettingsPanel from "@/components/SettingsPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { useScrollGradient } from "@/hooks/use-scroll-gradient";
import { UiExperience, useExperiences } from "@/lib/experiencesService";
import { translations } from "@/utils/translations";

const Experience = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [experiences, setExperiences] = useState<UiExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, theme } = useSettings();
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
        console.error("Failed to fetch experiences:", err);
        setError("Failed to load work experience data");
      } finally {
        setLoading(false);
      }
    };

    loadExperiences();
  }, [language]);

  const gradients = useScrollGradient(
    { from: "hsla(30,40%,99%,1)", via: "hsla(40,90%,96%,1)", to: "hsla(35,70%,90%,1)" },
    { from: "hsla(222,84%,5%,1)", via: "hsla(220,70%,18%,1)", to: "hsla(222,60%,12%,1)" },
  );

  return (
    <div
      className="relative min-h-screen text-foreground transition-colors duration-300"
      style={
        theme === "dark"
          ? { backgroundImage: `${gradients.darkBase}, ${gradients.darkOverlay}` }
          : { backgroundImage: gradients.lightGradient }
      }
    >
      {/* Header */}
      <header className="fixed top-0 z-40 w-full border-b border-orange-200/50 bg-orange-100/80 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/#hero"
            className="cursor-pointer bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-xl font-bold text-transparent transition-opacity hover:opacity-80 dark:from-purple-400 dark:to-blue-400"
          >
            Dawid Hanrahan
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden space-x-8 md:flex">
              <Link
                to="/"
                className="py-2 transition-colors hover:text-orange-600 dark:hover:text-purple-400"
              >
                {t.nav.home}
              </Link>
              <span className="cursor-default py-2 text-orange-600 dark:text-purple-400">
                {t.nav.experience}
              </span>
              <Link
                to="/academic"
                className="py-2 transition-colors hover:text-orange-600 dark:hover:text-purple-400"
              >
                {t.nav.academic}
              </Link>
            </nav>
            {/* Mobile Nav */}
            <div className="md:hidden">
              <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-orange-100/50 dark:hover:bg-white/10"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[85vw] max-w-sm">
                  <div className="mt-6 flex flex-col gap-1">
                    <div className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t.nav.mainPage}
                    </div>
                    <div className="flex flex-col">
                      <SheetClose asChild>
                        <a href="/#about">
                          <Button variant="ghost" className="justify-start pl-4 text-base">
                            {t.nav.about}
                          </Button>
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="/#skills">
                          <Button variant="ghost" className="justify-start pl-4 text-base">
                            {t.nav.skills}
                          </Button>
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="/#projects">
                          <Button variant="ghost" className="justify-start pl-4 text-base">
                            {t.nav.projects}
                          </Button>
                        </a>
                      </SheetClose>
                      <SheetClose asChild>
                        <a href="/#contact">
                          <Button variant="ghost" className="justify-start pl-4 text-base">
                            {t.nav.contact}
                          </Button>
                        </a>
                      </SheetClose>
                    </div>
                    <Separator className="my-3" />
                    <div className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t.nav.pages}
                    </div>
                    <SheetClose asChild>
                      <Link to="/experience">
                        <Button variant="ghost" className="mt-2 w-full justify-start text-base">
                          {t.nav.experience}
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/academic">
                        <Button variant="ghost" className="w-full justify-start text-base">
                          {t.nav.academic}
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full hover:bg-orange-100/50 dark:hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400">
              <Briefcase className="h-12 w-12 text-white" />
            </div>
            <h1 className="mb-6 text-5xl font-bold">
              <Reveal
                as="span"
                direction="right"
                offset={48}
                className="mr-2 inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.experience.title
                  .split(" ")
                  .slice(0, Math.ceil(t.experience.title.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
              <Reveal
                as="span"
                direction="left"
                delayMs={80}
                offset={48}
                className="inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.experience.title
                  .split(" ")
                  .slice(Math.ceil(t.experience.title.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
            </h1>
            <Reveal direction="up" delayMs={120}>
              <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
                {t.experience.subtitle}
              </p>
            </Reveal>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600 dark:border-purple-400"></div>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-lg text-red-500 dark:text-red-400">{t.experience.error}</p>
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
                <div className="py-20 text-center">
                  <p className="text-lg text-muted-foreground">{t.experience.noData}</p>
                </div>
              ) : (
                experiences.map((exp, idx) => (
                  <Reveal
                    key={exp.id}
                    direction={idx % 2 === 0 ? "right" : "left"}
                    delayMs={idx * 60}
                  >
                    <Card className="border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                      <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <Reveal direction="right" delayMs={0}>
                            <div>
                              <CardTitle className="mb-2 text-2xl text-card-foreground">
                                {exp.position}
                              </CardTitle>
                              <div className="mb-2 flex items-center gap-2 text-orange-600 dark:text-purple-400">
                                <Building className="h-5 w-5" />
                                <span className="text-lg font-semibold">{exp.company}</span>
                              </div>
                            </div>
                          </Reveal>
                          <Reveal direction="left" delayMs={60}>
                            <div className="flex flex-col gap-2 md:text-right">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{exp.period}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{exp.location}</span>
                              </div>
                            </div>
                          </Reveal>
                        </div>
                        <Reveal direction="up" delayMs={120}>
                          <CardDescription className="text-base leading-relaxed text-muted-foreground md:text-justify">
                            {exp.description}
                          </CardDescription>
                        </Reveal>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h4 className="mb-3 font-semibold text-card-foreground">
                              {t.experience.keyAchievements}
                            </h4>
                            <ul className="list-disc space-y-2 pl-6 text-muted-foreground marker:text-orange-600 dark:marker:text-purple-400">
                              {exp.achievements.map((achievement, i) => (
                                <li key={i}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="mb-3 font-semibold text-card-foreground">
                              {t.experience.technologies}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {exp.technologies.map((tech, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-center text-orange-700 dark:border-purple-400/30 dark:from-purple-500/20 dark:to-blue-500/20 dark:text-purple-300"
                                >
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
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
