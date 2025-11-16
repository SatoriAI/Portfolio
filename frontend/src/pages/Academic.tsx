import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ExternalLink,
  GraduationCap,
  Menu,
  Quote,
  Settings,
} from "lucide-react";

import Reveal from "@/components/Reveal";
import SettingsPanel from "@/components/SettingsPanel";
import SwipeHint from "@/components/SwipeHint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSettings } from "@/contexts/SettingsContext";
import { useScrollGradient } from "@/hooks/use-scroll-gradient";
import { UiPublication, usePublications } from "@/lib/publicationsService";
import { UiSchool, useSchools } from "@/lib/schoolsService";
import { UiTestimonial, useTestimonials } from "@/lib/testimonialsService";
import { translations } from "@/utils/translations";

const Academic = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [schools, setSchools] = useState<UiSchool[]>([]);
  const [publications, setPublications] = useState<UiPublication[]>([]);
  const [testimonials, setTestimonials] = useState<UiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language, theme } = useSettings();
  const t = translations[language];
  const schoolsService = useSchools();
  const publicationsService = usePublications();
  const testimonialsService = useTestimonials();

  // Mobile testimonials slider state
  const testimonialsSliderRef = useRef<HTMLDivElement>(null);
  const [testimonialsTouchStartX, setTestimonialsTouchStartX] = useState<number | null>(null);
  const [testimonialsTouchStartY, setTestimonialsTouchStartY] = useState<number | null>(null);
  const [testimonialsTouchDeltaX, setTestimonialsTouchDeltaX] = useState(0);
  const [testimonialsIsDragging, setTestimonialsIsDragging] = useState(false);
  const [testimonialsIsDirectionLocked, setTestimonialsIsDirectionLocked] = useState(false);
  const [testimonialsIsLockedToHorizontal, setTestimonialsIsLockedToHorizontal] = useState(false);
  const [testimonialsMobileIndex, setTestimonialsMobileIndex] = useState(1); // 1..n, with clones
  const [testimonialsAllowTransition, setTestimonialsAllowTransition] = useState(true);
  const [swipeHintSeen, setSwipeHintSeen] = useState<boolean>(false);
  const [showTestimonialsHint, setShowTestimonialsHint] = useState<boolean>(false);

  useEffect(() => {
    const loadAcademicData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load schools, publications, and testimonials in parallel
        const [schoolsData, publicationsData, testimonialsData] = await Promise.all([
          schoolsService.fetch(),
          publicationsService.fetch(),
          testimonialsService.fetch(),
        ]);

        setSchools(schoolsData);
        setPublications(publicationsData);
        setTestimonials(testimonialsData);
      } catch (err) {
        console.error("Failed to fetch academic data:", err);
        setError("Failed to load academic data");
      } finally {
        setLoading(false);
      }
    };

    loadAcademicData();
  }, [language]);

  // Reset testimonials mobile index when data changes
  useEffect(() => {
    setTestimonialsMobileIndex(1);
  }, [testimonials.length]);

  // Swipe hint: load persisted state once
  useEffect(() => {
    try {
      const seen = localStorage.getItem("swipeHintSeen.testimonials") === "true";
      setSwipeHintSeen(seen);
    } catch (_e) {
      // ignore
    }
  }, []);

  // Swipe hint: observe when the first mobile slide is fully visible
  useEffect(() => {
    const target = testimonialsSliderRef.current;
    if (!target) return;
    const hasMultiple = testimonials.length > 1;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const fullyVisible = entry.intersectionRatio >= 1;
        if (fullyVisible && !swipeHintSeen && hasMultiple && testimonialsMobileIndex === 1) {
          setShowTestimonialsHint(true);
        } else {
          setShowTestimonialsHint(false);
        }
      },
      { threshold: [1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [testimonialsMobileIndex, testimonials.length, swipeHintSeen]);

  const handleTestimonialsTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTestimonialsTouchStartX(e.touches[0].clientX);
    setTestimonialsTouchStartY(e.touches[0].clientY);
    setTestimonialsTouchDeltaX(0);
    setTestimonialsIsDragging(false);
    setTestimonialsIsDirectionLocked(false);
    setTestimonialsIsLockedToHorizontal(false);
  };

  const handleTestimonialsTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (testimonialsTouchStartX === null || testimonialsTouchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - testimonialsTouchStartX;
    const dy = currentY - testimonialsTouchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const lockFactor = 1.2;

    if (!testimonialsIsDirectionLocked) {
      if (absDx < 3 && absDy < 3) return;
      if (absDx > absDy * lockFactor) {
        setTestimonialsIsDirectionLocked(true);
        setTestimonialsIsLockedToHorizontal(true);
        setTestimonialsIsDragging(true);
        if (e.cancelable) e.preventDefault();
        setTestimonialsTouchDeltaX(dx);
      } else {
        setTestimonialsIsDirectionLocked(true);
        setTestimonialsIsLockedToHorizontal(false);
        setTestimonialsIsDragging(false);
      }
      return;
    }

    if (testimonialsIsLockedToHorizontal) {
      if (e.cancelable) e.preventDefault();
      setTestimonialsTouchDeltaX(dx);
    }
  };

  const handleTestimonialsTouchEnd = () => {
    if (!testimonialsIsDragging) {
      setTestimonialsTouchStartX(null);
      setTestimonialsTouchStartY(null);
      setTestimonialsTouchDeltaX(0);
      setTestimonialsIsDragging(false);
      setTestimonialsIsDirectionLocked(false);
      setTestimonialsIsLockedToHorizontal(false);
      return;
    }
    const threshold = 50;
    if (Math.abs(testimonialsTouchDeltaX) > threshold) {
      if (testimonialsTouchDeltaX < 0) setTestimonialsMobileIndex((i) => i + 1);
      else setTestimonialsMobileIndex((i) => i - 1);
      if (!swipeHintSeen) {
        try {
          localStorage.setItem("swipeHintSeen.testimonials", "true");
        } catch (_e) {
          // ignore
        }
        setSwipeHintSeen(true);
        setShowTestimonialsHint(false);
      }
    }
    setTestimonialsTouchStartX(null);
    setTestimonialsTouchStartY(null);
    setTestimonialsTouchDeltaX(0);
    setTestimonialsIsDragging(false);
    setTestimonialsIsDirectionLocked(false);
    setTestimonialsIsLockedToHorizontal(false);
  };

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
              <Link
                to="/experience"
                className="py-2 transition-colors hover:text-orange-600 dark:hover:text-purple-400"
              >
                {t.nav.experience}
              </Link>
              <span className="cursor-default py-2 text-orange-600 dark:text-purple-400">
                {t.nav.academic}
              </span>
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
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-400 dark:from-purple-400 dark:to-blue-400">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="mb-6 text-5xl font-bold">
              <Reveal
                as="span"
                direction="right"
                offset={48}
                className="mr-2 inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.academic.title
                  .split(" ")
                  .slice(0, Math.ceil(t.academic.title.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
              <Reveal
                as="span"
                direction="left"
                delayMs={80}
                offset={48}
                className="inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.academic.title
                  .split(" ")
                  .slice(Math.ceil(t.academic.title.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
            </h1>
            <Reveal direction="up" delayMs={120}>
              <p className="mx-auto max-w-4xl text-xl text-muted-foreground">
                {t.academic.subtitle}
              </p>
            </Reveal>
          </div>

          {/* Academic Information */}
          <section className="mb-20">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600 dark:border-purple-400"></div>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <p className="text-lg text-red-500 dark:text-red-400">{t.academic.error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {t.academic.tryAgain}
                </Button>
              </div>
            ) : schools.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-lg text-muted-foreground">{t.academic.noData}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {schools.map((school, idx) => (
                  <Reveal
                    key={school.id}
                    direction={idx % 2 === 0 ? "right" : "left"}
                    delayMs={idx * 60}
                  >
                    <Card className="border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                      <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <Reveal direction="right" delayMs={0}>
                            <div>
                              <CardTitle className="mb-2 text-2xl text-card-foreground">
                                {school.study}
                              </CardTitle>
                              <div className="mb-2 flex items-center gap-2 text-orange-600 dark:text-purple-400">
                                <GraduationCap className="h-5 w-5" />
                                <span className="text-lg font-semibold">{school.university}</span>
                                {school.degree && (
                                  <>
                                    <span>•</span>
                                    <span className="text-lg font-semibold">{school.degree}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Reveal>
                          <Reveal direction="left" delayMs={60}>
                            <div className="flex flex-col gap-2 md:text-right">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{school.period}</span>
                              </div>
                            </div>
                          </Reveal>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {school.research && (
                            <div>
                              <h4 className="mb-3 font-semibold text-card-foreground">
                                {t.academic.researchFocus}
                              </h4>
                              <p className="text-justify text-muted-foreground">
                                {school.research}
                              </p>
                            </div>
                          )}
                          {school.advisor && (
                            <div>
                              <h4 className="mb-3 font-semibold text-card-foreground">
                                {t.academic.advisor}
                              </h4>
                              <p className="text-muted-foreground">{school.advisor}</p>
                            </div>
                          )}
                          {school.areas.length > 0 && (
                            <div>
                              <h4 className="mb-3 font-semibold text-card-foreground">
                                {t.academic.researchAreas}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {school.areas.map((area, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 dark:border-purple-400/30 dark:from-purple-500/20 dark:to-blue-500/20 dark:text-purple-300"
                                  >
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          {/* Publications */}
          <section className="mb-20">
            <h2 className="mb-12 text-center text-4xl font-bold">
              <Reveal
                as="span"
                direction="right"
                offset={40}
                className="mr-2 inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.academic.publications
                  .split(" ")
                  .slice(0, Math.ceil(t.academic.publications.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
              <Reveal
                as="span"
                direction="left"
                delayMs={80}
                offset={40}
                className="inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.academic.publications
                  .split(" ")
                  .slice(Math.ceil(t.academic.publications.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600 dark:border-purple-400"></div>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <p className="text-lg text-red-500 dark:text-red-400">{t.academic.error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {t.academic.tryAgain}
                </Button>
              </div>
            ) : publications.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-lg text-muted-foreground">{t.academic.noPublications}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {publications.map((pub, idx) => (
                  <Reveal
                    key={pub.id}
                    direction={idx % 2 === 0 ? "right" : "left"}
                    delayMs={idx * 60}
                  >
                    <Card className="border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <Reveal direction="right">
                            <div className="flex-1">
                              <CardTitle className="mb-2 flex items-start gap-3 text-xl text-card-foreground">
                                <BookOpen className="mt-1 h-6 w-6 flex-shrink-0 text-orange-600 dark:text-purple-400" />
                                {pub.title}
                              </CardTitle>
                              <div className="mb-3 flex flex-wrap items-center gap-4 text-muted-foreground">
                                <span className="font-medium">{pub.journal}</span>
                                <span>•</span>
                                <span>{pub.year}</span>
                              </div>
                            </div>
                          </Reveal>
                          {pub.link && (
                            <Reveal direction="left" delayMs={60}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hidden border-orange-400/30 hover:border-orange-500 dark:border-purple-400/30 dark:hover:border-purple-400 md:inline-flex"
                                onClick={() => window.open(pub.link, "_blank")}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {t.academic.view}
                              </Button>
                            </Reveal>
                          )}
                        </div>
                        {pub.summary && (
                          <CardDescription className="text-justify text-muted-foreground">
                            {pub.summary}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {pub.link && (
                        <CardContent className="md:hidden">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full border-orange-400/30 hover:border-orange-500 dark:border-purple-400/30 dark:hover:border-purple-400"
                            onClick={() => window.open(pub.link, "_blank")}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t.academic.view}
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </section>

          {/* Student Testimonials */}
          <section>
            <h2 className="mb-12 text-center text-4xl font-bold">
              <Reveal
                as="span"
                direction="right"
                offset={40}
                className="mr-2 inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.academic.studentTestimonials
                  .split(" ")
                  .slice(0, Math.ceil(t.academic.studentTestimonials.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
              <Reveal
                as="span"
                direction="left"
                delayMs={80}
                offset={40}
                className="inline-block bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400"
              >
                {t.academic.studentTestimonials
                  .split(" ")
                  .slice(Math.ceil(t.academic.studentTestimonials.split(" ").length / 2))
                  .join(" ")}
              </Reveal>
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-orange-600 dark:border-purple-400"></div>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <p className="text-lg text-red-500 dark:text-red-400">{t.academic.error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {t.academic.tryAgain}
                </Button>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-lg text-muted-foreground">{t.academic.noTestimonials}</p>
              </div>
            ) : (
              <>
                {/* Mobile: single-card swipe carousel, i.e. Tinder like feature */}
                <div
                  className="-mx-6 overflow-hidden md:hidden"
                  ref={testimonialsSliderRef}
                  onTouchStart={handleTestimonialsTouchStart}
                  onTouchMove={handleTestimonialsTouchMove}
                  onTouchEnd={handleTestimonialsTouchEnd}
                >
                  {(() => {
                    const containerWidth = testimonialsSliderRef.current?.clientWidth || 1;
                    const slides =
                      testimonials.length > 0
                        ? [testimonials[testimonials.length - 1], ...testimonials, testimonials[0]]
                        : [];
                    const translatePx =
                      -(testimonialsMobileIndex * containerWidth) +
                      (testimonialsIsDragging ? testimonialsTouchDeltaX : 0);
                    return (
                      <div
                        className="flex"
                        style={{
                          transform: `translateX(${translatePx}px)`,
                          transition:
                            testimonialsIsDragging || !testimonialsAllowTransition
                              ? "none"
                              : "transform 320ms ease",
                        }}
                        onTransitionEnd={() => {
                          if (testimonials.length === 0) return;
                          if (testimonialsMobileIndex === 0) {
                            setTestimonialsAllowTransition(false);
                            requestAnimationFrame(() => {
                              setTestimonialsMobileIndex(testimonials.length);
                              requestAnimationFrame(() => setTestimonialsAllowTransition(true));
                            });
                          } else if (testimonialsMobileIndex === testimonials.length + 1) {
                            setTestimonialsAllowTransition(false);
                            requestAnimationFrame(() => {
                              setTestimonialsMobileIndex(1);
                              requestAnimationFrame(() => setTestimonialsAllowTransition(true));
                            });
                          }
                        }}
                      >
                        {slides.map((testimonial, index) => (
                          <div key={index} className="w-full flex-none px-6">
                            <Card className="border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                              <CardHeader>
                                <CardTitle className="text-lg text-card-foreground">
                                  {testimonial.name}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                  {testimonial.course} • {testimonial.semester}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <p className="text-center italic leading-relaxed text-muted-foreground">
                                  {testimonial.text}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <SwipeHint visible={showTestimonialsHint} text={t.hints.swipeMore} />

                {/* Tablet/Desktop: infinite carousel */}
                <div className="hidden md:block">
                  <Carousel
                    opts={{ loop: true, align: "start", watchDrag: false }}
                    className="w-full"
                  >
                    <CarouselContent>
                      {testimonials.map((testimonial) => (
                        <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                          <Card className="border-orange-200/50 bg-orange-50/50 transition-all duration-300 hover:bg-orange-100/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                            <CardHeader>
                              <div className="mb-3 flex items-center gap-3">
                                <Quote className="h-6 w-6 text-orange-600 dark:text-purple-400" />
                              </div>
                              <CardTitle className="text-lg text-card-foreground">
                                {testimonial.course}
                              </CardTitle>
                              <CardDescription className="text-muted-foreground">
                                {testimonial.semester}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-center italic leading-relaxed text-muted-foreground">
                                {testimonial.text}
                              </p>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              </>
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
