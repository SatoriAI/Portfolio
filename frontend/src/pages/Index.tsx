import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Code,
  Database,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Menu,
  MessageSquare,
  Server,
  Settings,
  User,
} from "lucide-react";

import ChatWidget from "@/components/ChatWidget";
import Reveal from "@/components/Reveal";
import SettingsPanel from "@/components/SettingsPanel";
import SwipeHint from "@/components/SwipeHint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { env } from "@/config/env";
import { useSettings } from "@/contexts/SettingsContext";
import { useScrollGradient } from "@/hooks/use-scroll-gradient";
import type { UiProject } from "@/lib/projectsService";
import { fetchProjects } from "@/lib/projectsService";
import type { UiSkill } from "@/lib/skillsService";
import { fetchSkills } from "@/lib/skillsService";
import { translations } from "@/utils/translations";

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHomeDropdownOpen, setIsHomeDropdownOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { language, theme } = useSettings();
  const mobileSliderRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDirectionLocked, setIsDirectionLocked] = useState(false);
  const [isLockedToHorizontal, setIsLockedToHorizontal] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(1); // 1..projects.length for cloned edges
  const [allowTransition, setAllowTransition] = useState(true);
  const [swipeHintSeen, setSwipeHintSeen] = useState<boolean>(false);
  const [showProjectsHint, setShowProjectsHint] = useState<boolean>(false);

  const t = translations[language];
  const gradients = useScrollGradient(
    { from: "hsla(30,40%,99%,1)", via: "hsla(40,90%,96%,1)", to: "hsla(35,70%,90%,1)" },
    { from: "hsla(222,84%,5%,1)", via: "hsla(220,70%,18%,1)", to: "hsla(222,60%,12%,1)" },
  );

  // Build About title halves for side-to-center reveal
  const aboutTitleWords = t.about.title.split(" ");
  const aboutTitleMidIndex = Math.ceil(aboutTitleWords.length / 2);
  const aboutTitleLeft = aboutTitleWords.slice(0, aboutTitleMidIndex).join(" ");
  const aboutTitleRight = aboutTitleWords.slice(aboutTitleMidIndex).join(" ");

  const renderTwoWordAnimatedTitle = (title: string, gradientClass: string) => {
    const words = title.trim().split(/\s+/);
    if (words.length === 2) {
      return (
        <>
          <Reveal
            as="span"
            direction="right"
            offset={48}
            className={`mr-2 inline-block ${gradientClass} bg-clip-text text-transparent`}
          >
            {words[0]}
          </Reveal>
          <Reveal
            as="span"
            direction="left"
            delayMs={80}
            offset={48}
            className={`inline-block ${gradientClass} bg-clip-text text-transparent`}
          >
            {words[1]}
          </Reveal>
        </>
      );
    }
    return <span className={`${gradientClass} bg-clip-text text-transparent`}>{title}</span>;
  };

  const sampleSkills: UiSkill[] = [
    {
      icon: Code,
      name: "Python",
      level: "Expert",
      description: "Backend development, APIs, automation",
    },
    {
      icon: Database,
      name: "Databases",
      level: "Advanced",
      description: "PostgreSQL, MongoDB, Redis",
    },
    {
      icon: Brain,
      name: "LLMs & RAG",
      level: "Expert",
      description: "Pipeline development, vector databases",
    },
    {
      icon: Server,
      name: "Infrastructure",
      level: "Advanced",
      description: "AWS, Docker, Kubernetes",
    },
  ];

  const sampleProjects: UiProject[] = [
    {
      title: "Intelligent Document RAG System",
      description:
        "Built a sophisticated RAG pipeline for document analysis using vector embeddings and LLMs",
      technologies: ["Python", "LangChain", "ChromaDB", "OpenAI"],
      github: "#",
      demo: "#",
      image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=300&fit=crop",
    },
    {
      title: "Scalable Backend Architecture",
      description:
        "Designed and implemented microservices architecture handling 1M+ requests daily",
      technologies: ["Python", "FastAPI", "PostgreSQL", "Redis"],
      github: "#",
      demo: "#",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop",
    },
    {
      title: "Infrastructure Automation Suite",
      description: "Created comprehensive DevOps pipeline with automated testing and deployment",
      technologies: ["Python", "Terraform", "AWS", "Docker"],
      github: "#",
      demo: "#",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    },
  ];

  const [projects, setProjects] = useState<UiProject[]>(sampleProjects);
  const [skills, setSkills] = useState<UiSkill[]>(sampleSkills);

  useEffect(() => {
    if (env.mock) return;
    fetchProjects(language)
      .then(setProjects)
      .catch((err) => {
        console.error("Failed to fetch projects, falling back to sample data:", err);
        setProjects(sampleProjects);
      });
  }, [language]);

  useEffect(() => {
    if (env.mock) return;
    fetchSkills(language)
      .then(setSkills)
      .catch((err) => {
        console.error("Failed to fetch skills, falling back to sample data:", err);
        setSkills(sampleSkills);
      });
  }, [language]);

  // Swipe hint: load persisted state once
  useEffect(() => {
    try {
      const seen = localStorage.getItem("swipeHintSeen.projects") === "true";
      setSwipeHintSeen(seen);
    } catch (_e) {
      // ignore
    }
  }, []);

  // Swipe hint: observe when the first mobile slide is fully visible
  useEffect(() => {
    const target = mobileSliderRef.current;
    if (!target) return;
    const hasMultiple = projects.length > 1;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const fullyVisible = entry.intersectionRatio >= 1;
        if (fullyVisible && !swipeHintSeen && hasMultiple && mobileIndex === 1) {
          setShowProjectsHint(true);
        } else {
          setShowProjectsHint(false);
        }
      },
      { threshold: [1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [mobileIndex, projects.length, swipeHintSeen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsHomeDropdownOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Desktop carousel uses Embla via Carousel component; mobile uses custom touch slider below

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setTouchDeltaX(0);
    setIsDragging(false);
    setIsDirectionLocked(false);
    setIsLockedToHorizontal(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - touchStartX;
    const dy = currentY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const lockFactor = 1.2;

    if (!isDirectionLocked) {
      if (absDx < 3 && absDy < 3) return;
      if (absDx > absDy * lockFactor) {
        setIsDirectionLocked(true);
        setIsLockedToHorizontal(true);
        setIsDragging(true);
        if (e.cancelable) e.preventDefault();
        setTouchDeltaX(dx);
      } else {
        setIsDirectionLocked(true);
        setIsLockedToHorizontal(false);
        setIsDragging(false);
      }
      return;
    }

    if (isLockedToHorizontal) {
      if (e.cancelable) e.preventDefault();
      setTouchDeltaX(dx);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) {
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchDeltaX(0);
      setIsDragging(false);
      setIsDirectionLocked(false);
      setIsLockedToHorizontal(false);
      return;
    }
    const threshold = 50;
    if (Math.abs(touchDeltaX) > threshold) {
      if (touchDeltaX < 0) setMobileIndex((i) => i + 1);
      else setMobileIndex((i) => i - 1);
      if (!swipeHintSeen) {
        try {
          localStorage.setItem("swipeHintSeen.projects", "true");
        } catch (_e) {
          // ignore
        }
        setSwipeHintSeen(true);
        setShowProjectsHint(false);
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDeltaX(0);
    setIsDragging(false);
    setIsDirectionLocked(false);
    setIsLockedToHorizontal(false);
  };

  // Reset mobileIndex when projects change
  useEffect(() => {
    setMobileIndex(1);
  }, [projects.length]);

  // No desktop index sync needed when using Embla-based Carousel

  // Ensure desktop carousel can loop even with few projects by duplicating items
  const projectsForDesktopCarousel =
    projects.length > 0
      ? Array.from({ length: projects.length >= 6 ? 1 : Math.ceil(6 / projects.length) }).flatMap(
          () => projects,
        )
      : [];

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
          <button
            onClick={scrollToTop}
            className="cursor-pointer bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-xl font-bold text-transparent transition-opacity hover:opacity-80 dark:from-purple-400 dark:to-blue-400"
            type="button"
          >
            Dawid Hanrahan
          </button>
          <div className="flex items-center gap-4">
            <nav className="hidden space-x-8 md:flex">
              <div
                className="relative"
                onMouseEnter={handleHomeAreaEnter}
                onMouseLeave={handleHomeAreaLeave}
              >
                <button
                  onClick={scrollToTop}
                  className="py-2 text-orange-600 transition-colors hover:text-orange-500 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  {t.nav.home}
                </button>
                {isHomeDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0 min-w-[120px] rounded-lg border border-orange-200/50 bg-orange-50/95 py-2 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-black/95">
                    <button
                      onClick={() => handleDropdownItemClick("about")}
                      className="block w-full px-4 py-2 text-left text-orange-800 transition-colors hover:bg-orange-100/50 hover:text-orange-600 dark:text-white dark:hover:bg-white/10 dark:hover:text-purple-400"
                    >
                      {t.nav.about}
                    </button>
                    <button
                      onClick={() => handleDropdownItemClick("skills")}
                      className="block w-full px-4 py-2 text-left text-orange-800 transition-colors hover:bg-orange-100/50 hover:text-orange-600 dark:text-white dark:hover:bg-white/10 dark:hover:text-purple-400"
                    >
                      {t.nav.skills}
                    </button>
                    <button
                      onClick={() => handleDropdownItemClick("projects")}
                      className="block w-full px-4 py-2 text-left text-orange-800 transition-colors hover:bg-orange-100/50 hover:text-orange-600 dark:text-white dark:hover:bg-white/10 dark:hover:text-purple-400"
                    >
                      {t.nav.projects}
                    </button>
                    <button
                      onClick={() => handleDropdownItemClick("contact")}
                      className="block w-full px-4 py-2 text-left text-orange-800 transition-colors hover:bg-orange-100/50 hover:text-orange-600 dark:text-white dark:hover:bg-white/10 dark:hover:text-purple-400"
                    >
                      {t.nav.contact}
                    </button>
                  </div>
                )}
              </div>
              <Link
                to="/experience"
                className="py-2 transition-colors hover:text-orange-600 dark:hover:text-purple-400"
              >
                {t.nav.experience}
              </Link>
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
                <SheetContent className="w-[85vw] max-w-sm pb-[env(safe-area-inset-bottom)]">
                  <div className="mt-6 flex flex-col gap-1">
                    <div className="px-1 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t.nav.mainPage}
                    </div>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        className="justify-start pl-4 text-base"
                        onClick={() => {
                          handleDropdownItemClick("about");
                          setIsMobileNavOpen(false);
                        }}
                      >
                        {t.nav.about}
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start pl-4 text-base"
                        onClick={() => {
                          handleDropdownItemClick("skills");
                          setIsMobileNavOpen(false);
                        }}
                      >
                        {t.nav.skills}
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start pl-4 text-base"
                        onClick={() => {
                          handleDropdownItemClick("projects");
                          setIsMobileNavOpen(false);
                        }}
                      >
                        {t.nav.projects}
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start pl-4 text-base"
                        onClick={() => {
                          handleDropdownItemClick("contact");
                          setIsMobileNavOpen(false);
                        }}
                      >
                        {t.nav.contact}
                      </Button>
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

      {/* Hero Section */}
      <section id="hero" className="px-6 pb-24 pt-36 md:pb-20 md:pt-32">
        <div className="mx-auto max-w-6xl text-center">
          <Reveal direction="up" delayMs={50}>
            <div className="mb-8">
              <img
                src="/profile-picture.jpg"
                alt="Profile picture"
                className="mx-auto mb-6 h-32 w-32 rounded-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal
            as="h1"
            direction="up"
            delayMs={100}
            className="mb-6 text-5xl font-bold md:text-7xl"
          >
            <span
              className="shine-title bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 bg-clip-text text-transparent dark:from-purple-400 dark:via-blue-400 dark:to-purple-400"
              data-text={t.hero.title}
            >
              {t.hero.title}
            </span>
          </Reveal>
          <Reveal
            as="p"
            direction="up"
            delayMs={150}
            className="mx-auto mb-8 max-w-5xl text-xl text-muted-foreground md:text-2xl"
          >
            {t.hero.subtitle}
          </Reveal>
          <Reveal direction="up" delayMs={200}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                onClick={() => setIsChatOpen(true)}
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-red-600 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {t.hero.askAI}
              </Button>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400"
                  asChild
                >
                  <a href="https://github.com/SatoriAI" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400"
                  asChild
                >
                  <a href="mailto:dawidhanrahan@gmail.com">
                    <Mail className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-6 py-24 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-5xl font-bold">
              <Reveal
                as="span"
                direction="right"
                delayMs={0}
                offset={48}
                className="mr-2 inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {aboutTitleLeft}
              </Reveal>
              {aboutTitleRight && (
                <Reveal
                  as="span"
                  direction="left"
                  delayMs={80}
                  offset={48}
                  className="inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
                >
                  {aboutTitleRight}
                </Reveal>
              )}
            </h2>
          </div>

          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <Reveal direction="right" delayMs={0} offset={48}>
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground md:text-justify">
                  {t.about.paragraph1}
                </p>
              </Reveal>
              <Reveal direction="right" delayMs={140} offset={48}>
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground md:text-justify">
                  {t.about.paragraph2}
                </p>
              </Reveal>
            </div>
            <Reveal direction="left" delayMs={100} offset={48}>
              <Card className="border-orange-200/50 bg-orange-50/50 dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-center text-card-foreground">
                    {t.about.philosophy}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="md:text-justify">{t.about.philosophyText}</p>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="px-6 py-24 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal direction="up">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-5xl font-bold">
                {renderTwoWordAnimatedTitle(
                  t.skills.title,
                  "bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400",
                )}
              </h2>
              <p className="mx-auto max-w-4xl text-xl text-muted-foreground">{t.skills.subtitle}</p>
            </div>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill, index) => (
              <Reveal
                key={index}
                direction={index % 2 === 0 ? "left" : "right"}
                delayMs={index * 60}
              >
                <Card className="flex h-[320px] flex-col border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:scale-105 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                  <CardHeader className="flex flex-shrink-0 flex-col items-center justify-center text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400">
                      <skill.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="flex min-h-[1.5rem] items-center justify-center text-lg text-card-foreground">
                      {skill.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="mt-3 justify-center rounded-full border-orange-500/40 bg-orange-500/25 px-3 py-1.5 text-sm font-semibold text-orange-700 shadow-sm ring-1 ring-orange-500/30 dark:border-blue-500/40 dark:bg-blue-500/25 dark:text-blue-300 dark:ring-blue-500/30 md:text-xs"
                    >
                      {skill.level}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-grow items-start justify-center px-4 pt-0">
                    <p className="text-center text-base leading-relaxed text-muted-foreground md:text-sm">
                      {skill.description}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="px-6 py-24 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal direction="up">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-5xl font-bold">
                {renderTwoWordAnimatedTitle(
                  t.projects.title,
                  "bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400",
                )}
              </h2>
              <p className="mx-auto max-w-4xl text-xl text-muted-foreground">
                {t.projects.subtitle}
              </p>
            </div>
          </Reveal>
          <div className="relative">
            {/* Mobile: Single-card swipe carousel */}
            <div
              className="-mx-6 overflow-hidden md:hidden"
              ref={mobileSliderRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {(() => {
                const containerWidth = mobileSliderRef.current?.clientWidth || 1;
                // Build slides with clones for infinite loop
                const slides =
                  projects.length > 0
                    ? [projects[projects.length - 1], ...projects, projects[0]]
                    : [];
                const translatePx =
                  -(mobileIndex * containerWidth) + (isDragging ? touchDeltaX : 0);
                return (
                  <div
                    className="flex"
                    style={{
                      transform: `translateX(${translatePx}px)`,
                      transition: isDragging || !allowTransition ? "none" : "transform 320ms ease",
                    }}
                    onTransitionEnd={() => {
                      // Seamless loop: if at clones, jump without animation
                      if (projects.length === 0) return;
                      if (mobileIndex === 0) {
                        setAllowTransition(false);
                        requestAnimationFrame(() => {
                          setMobileIndex(projects.length);
                          requestAnimationFrame(() => setAllowTransition(true));
                        });
                      } else if (mobileIndex === projects.length + 1) {
                        setAllowTransition(false);
                        requestAnimationFrame(() => {
                          setMobileIndex(1);
                          requestAnimationFrame(() => setAllowTransition(true));
                        });
                      }
                    }}
                  >
                    {slides.map((project, index) => (
                      <div key={index} className="w-full flex-none px-6">
                        <Card className="overflow-hidden border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400">
                            <img
                              src={project.image}
                              alt={project.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <CardHeader>
                            <CardTitle className="text-center text-card-foreground">
                              {project.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="mb-4 text-muted-foreground">{project.description}</p>
                            <div className="mb-4 flex flex-wrap gap-2">
                              {project.technologies.map((tech, techIndex) => (
                                <Badge
                                  key={techIndex}
                                  variant="secondary"
                                  className="border-orange-500/30 bg-orange-500/20 text-orange-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300"
                                >
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              {project.github ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400"
                                  asChild
                                >
                                  <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Github className="mr-2 h-4 w-4" />
                                    {t.projects.code}
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 cursor-not-allowed border-orange-300 opacity-50 dark:border-gray-600"
                                  disabled
                                >
                                  <Github className="mr-2 h-4 w-4" />
                                  {t.projects.code}
                                </Button>
                              )}
                              {project.demo ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400"
                                  asChild
                                >
                                  <a href={project.demo} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Demo
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 cursor-not-allowed border-orange-300 opacity-50 dark:border-gray-600"
                                  disabled
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Demo
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <SwipeHint visible={showProjectsHint} text={t.hints.swipeMore} />

            {/* Tablet/Desktop: infinite carousel like testimonials */}
            <div className="hidden md:block md:px-12">
              <Carousel opts={{ loop: true, align: "start", watchDrag: false }} className="w-full">
                <CarouselContent>
                  {projectsForDesktopCarousel.map((project, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <Card className="overflow-hidden border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="text-center text-card-foreground">
                            {project.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4 text-muted-foreground">{project.description}</p>
                          <div className="mb-4 flex flex-wrap gap-2">
                            {project.technologies.map((tech, techIndex) => (
                              <Badge
                                key={techIndex}
                                variant="secondary"
                                className="border-orange-500/30 bg-orange-500/20 text-orange-700 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            {project.github ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400"
                                asChild
                              >
                                <a href={project.github} target="_blank" rel="noopener noreferrer">
                                  <Github className="mr-2 h-4 w-4" />
                                  {t.projects.code}
                                </a>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 cursor-not-allowed border-orange-300 opacity-50 dark:border-gray-600"
                                disabled
                              >
                                <Github className="mr-2 h-4 w-4" />
                                {t.projects.code}
                              </Button>
                            )}
                            {project.demo ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 border-orange-300 hover:border-orange-500 dark:border-gray-600 dark:hover:border-blue-400"
                                asChild
                              >
                                <a href={project.demo} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Demo
                                </a>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 cursor-not-allowed border-orange-300 opacity-50 dark:border-gray-600"
                                disabled
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Demo
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>

            {/* No desktop indicators to match testimonials */}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 py-24 md:py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal direction="up">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-5xl font-bold">
                {renderTwoWordAnimatedTitle(
                  t.contact.title,
                  "bg-gradient-to-r from-orange-600 to-red-500 dark:from-purple-400 dark:to-blue-400",
                )}
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                {t.contact.subtitle2}
              </p>
            </div>
          </Reveal>

          <div className="grid gap-12 md:grid-cols-2">
            <Reveal direction="left">
              <div className="space-y-6">
                <Card className="border-orange-200/50 bg-orange-50/50 dark:border-white/10 dark:bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <Mail className="h-5 w-5" />
                      {t.contact.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      <a
                        href="mailto:dawidhanrahan@gmail.com"
                        className="transition-colors hover:text-orange-600 dark:hover:text-purple-400"
                      >
                        dawidhanrahan@gmail.com
                      </a>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200/50 bg-orange-50/50 dark:border-white/10 dark:bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <Github className="h-5 w-5" />
                      GitHub
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      <a
                        href="https://github.com/SatoriAI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-orange-600 dark:hover:text-purple-400"
                      >
                        github.com/SatoriAI
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </Reveal>

            <Reveal direction="right">
              <Card className="flex h-full flex-col items-center justify-center border-orange-200/50 bg-orange-50/50 text-center dark:border-white/10 dark:bg-white/5">
                <CardHeader className="items-center">
                  <CardTitle className="text-card-foreground">{t.contact.quickMessage}</CardTitle>
                </CardHeader>
                <CardContent className="flex w-full flex-col items-center justify-center text-center">
                  <p className="mb-4 text-muted-foreground">{t.contact.quickMessageDesc}</p>
                  <Button
                    onClick={() => setIsChatOpen(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t.hero.askAI}
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
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
          className="fixed right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg transition-all duration-300 hover:scale-110 hover:from-orange-600 hover:to-red-600 hover:shadow-xl dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Index;
